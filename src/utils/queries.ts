import { DataSource } from 'typeorm';
import { ParseType, QueryParse } from '../parser/queryParse';
import {
  ONE,
  VARS_TABLE,
  ZERO,
} from './constants';
import { Method } from './method';
import { Names } from './names';
import { Variable } from './variable';

export const COMMIT_START: string = `BEGIN IMMEDIATE TRANSACTION;`;
export const COMMIT_CANCEL: string = `ROLLBACK TRANSACTION;`;
export const COMMIT_END: string = `COMMIT TRANSACTION;`;

export class QueryUtils {
  static async getTableModify(
    DB: DataSource,
    statement: QueryParse
  ): Promise<QueryParse[]> {
    const results: QueryParse[] = [];

    let oldTableName: string;
    let newTableName: string;

    let triggerAddName: string;
    let triggerSetName: string;
    let triggerDelName: string;

    let delTable: string;

    switch (statement.type) {
      case ParseType.create_table:
        newTableName = statement.tablesWrite[ZERO];

        /* #region  Create the diffs column and del table. */
        if (!statement.columns.includes(Names.VERSION_COLUMN)) {
          results.push(new QueryParse({
            query: `ALTER TABLE ${newTableName} ADD COLUMN ${Names.VERSION_COLUMN} INTEGER;`,
            params: []
          }));
        }

        // Delete the del table if it exists.
        delTable = Names.getDelTable(newTableName);
        results.push(this.tableDel(delTable));

        // Create the del table.
        results.push(this.delTableAdd(delTable));
        /* #endregion */

        /* #region  Create the triggers. */
        // Remove the triggers if they exist.
        triggerAddName = Names.getTrigger(newTableName, Method.add);
        triggerSetName = Names.getTrigger(newTableName, Method.set);
        triggerDelName = Names.getTrigger(newTableName, Method.del);
        results.push(this.triggerDel(triggerAddName));
        results.push(this.triggerDel(triggerSetName));
        results.push(this.triggerDel(triggerDelName));

        const triggerAddQuery = this.triggerAdd(
          Method.add,
          triggerAddName,
          newTableName,
          statement.columns
        );
        const triggerSetQuery: QueryParse = this.triggerAdd(
          Method.set,
          triggerSetName,
          newTableName,
          statement.columns
        );
        const triggerDelQuery: QueryParse = this.triggerAddDel(
          Method.del,
          triggerDelName,
          newTableName,
          delTable
        );

        // Add the triggers.
        results.push(triggerAddQuery);
        results.push(triggerSetQuery);
        results.push(triggerDelQuery);
        /* #endregion */
        break;

      case ParseType.rename_table:
      case ParseType.modify_table_columns:
        oldTableName = statement.tablesWrite[ZERO];

        // Delete the triggers.
        triggerAddName = Names.getTrigger(oldTableName, Method.add);
        triggerSetName = Names.getTrigger(oldTableName, Method.set);
        triggerDelName = Names.getTrigger(oldTableName, Method.del);
        results.push(QueryUtils.triggerDel(triggerAddName));
        results.push(QueryUtils.triggerDel(triggerSetName));
        results.push(QueryUtils.triggerDel(triggerDelName));

        // Delete the del tables
        delTable = Names.getDelTable(oldTableName);
        results.push(this.tableDel(delTable));

        // Update the table name if it is renamed.
        if (statement.type === ParseType.rename_table) {
          newTableName = statement.tablesWrite[ONE];
        } else {
          newTableName = oldTableName;
        }

        /* #region Re-create the table triggers. */
        const tableCreateStatement =
          await QueryUtils.tableAdd(DB, oldTableName, newTableName);
        const newTableQueries =
          await QueryUtils.getTableModify(DB, tableCreateStatement);
        results.push(...newTableQueries);
        /* #endregion */
        break;

      case ParseType.drop_table:
        oldTableName = statement.tablesWrite[ZERO];

        // Triggers are automatically deleted when the table is deleted.
        // Delete the diff tables.
        delTable = Names.getDelTable(oldTableName);
        results.push(this.tableDel(delTable));
        break;

      default:
        break;
    }

    return results;
  }

  /* #region Del tables. */
  private static delTableAdd(
    delTableName: string,
  ): QueryParse {
    const query = `CREATE TABLE IF NOT EXISTS ${delTableName} (
      id INTEGER PRIMARY KEY,
      ${Names.VERSION_COLUMN} INTEGER NOT NULL
    );`;

    return new QueryParse({
      query,
      params: []
    });
  }
  /* #endregion */

  /* #region Tables. */
  private static async tableAdd(
    DB: DataSource,
    oldTableName: string,
    newTableName: string
  ): Promise<QueryParse> {
    let tableCreateQuery = `${await QueryUtils.tableGet(DB, oldTableName)};`;
    const replaceNameRegEx = new RegExp(oldTableName, `gi`);
    tableCreateQuery =
      tableCreateQuery.replace(replaceNameRegEx, newTableName);
    const tableCreateStatement = new QueryParse({
      query: tableCreateQuery,
      params: []
    });
    return tableCreateStatement;
  }

  private static tableDel(name: string): QueryParse {
    return new QueryParse({
      query: `DROP TABLE IF EXISTS ${name};`,
      params: []
    });
  }

  private static async tableGet(
    DB: DataSource,
    name: string
  ): Promise<string> {
    // Get the create table query from the SQLite master table.
    return (await DB.query(
      `SELECT sql FROM sqlite_master WHERE name = ?;`,
      [name]
    ))?.[ZERO]?.sql;
  }
  /* #endregion */

  /* #region Triggers. */
  private static triggerAdd(
    method: Method,
    name: string,
    table: string,
    columns: string[],
  ): QueryParse {
    let op: string;
    switch (method) {
      case Method.add: op = `INSERT`; break;
      case Method.set: op = `UPDATE`; break;
      default: break;
    }

    const query = `CREATE TRIGGER
IF NOT EXISTS ${name}
  AFTER ${op}
  ON ${table}
BEGIN
  UPDATE user SET ${Names.VERSION_COLUMN} = (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.version}") WHERE ROWID = NEW.ROWID;
END;`;
    
    return new QueryParse({
      query,
      params: []
    });
  }

  private static triggerAddDel(
    method: Method,
    name: string,
    table: string,
    delName: string,
  ): QueryParse {
    const entity = "OLD";

    let op: string;
    switch (method) {
      case Method.del: op = `DELETE`; break;
      default: break;
    }

    const query = `CREATE TRIGGER
IF NOT EXISTS ${name}
  AFTER ${op}
  ON ${table}
BEGIN
  INSERT OR REPLACE INTO ${delName}
  VALUES (OLD.ROWID, (SELECT value FROM ${VARS_TABLE} where name = "${Variable.version}"));
END;`;
    
    return new QueryParse({
      query,
      params: []
    });
  }

  private static triggerDel(name: string): QueryParse {
    return new QueryParse({
      query: `DROP TRIGGER IF EXISTS ${name};`,
      params: []
    });
  }
  /* #endregion */
}