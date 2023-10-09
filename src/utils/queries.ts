import { DataSource } from 'typeorm';
import { ParseType, QueryParse } from '../parser/queryParse';
import {
  ONE,
  STATEMENT_DELIMITER,
  TABLES_TABLE,
  VALUE_DELIMITER,
  VARS_TABLE,
  ZERO,
} from './constants';
import { Method } from './method';
import { Names } from './names';
import { Variable } from './variable';

export const COMMIT_START: string = `BEGIN IMMEDIATE TRANSACTION;`;
export const COMMIT_CANCEL: string = `ROLLBACK TRANSACTION;`;
export const COMMIT_END: string = `COMMIT TRANSACTION;`;

export const SET_FLAGS_TRUE: QueryParse = new QueryParse({
  query:
    `UPDATE ${VARS_TABLE} SET value = ? WHERE name IN ("${Variable.isDiff}", "${Variable.isMemory}");`,
  params: [ONE],
});

const AS_SELECT_REGEX = /AS[\s]+SELECT[\s\S]*/gi;

export class QueryUtils {
  static getSetFlag(variableID: Variable, value: boolean): QueryParse {
    return new QueryParse({
      query: `UPDATE ${VARS_TABLE} SET value = ? WHERE name = ?;`,
      params: [value ? ONE : ZERO, variableID]
    });
  }

  static async getTableModify(
    DB: DataSource,
    statement: QueryParse,
    isMemory: boolean = false
  ): Promise<QueryParse[]> {
    const results: QueryParse[] = [];

    let oldTableName: string;
    let newTableName: string;

    let triggerAddName: string;
    let triggerDelName: string;
    let triggerSetName: string;

    let diffTableAdd: string;
    let diffTableDel: string;
    let diffTableSet: string;

    switch (statement.type) {
      case ParseType.create_table:
        newTableName = statement.tablesWrite[ZERO];

        /* #region  Create the diffs table. */
        // Delete the diffs tables if they exist.
        diffTableAdd = Names.getDiffTable(newTableName, Method.add);
        diffTableDel = Names.getDiffTable(newTableName, Method.del);
        diffTableSet = Names.getDiffTable(newTableName, Method.set);
        results.push(this.tableDel(diffTableAdd));
        results.push(this.tableDel(diffTableDel));
        results.push(this.tableDel(diffTableSet));

        // Create the diffs tables.
        results.push(
          this.diffTableAdd(statement.query, newTableName, diffTableAdd)
        );
        results.push(
          this.diffTableAdd(statement.query, newTableName, diffTableDel)
        );
        results.push(
          this.diffTableAdd(statement.query, newTableName, diffTableSet)
        );
        /* #endregion */

        /* #region  Create the triggers. */
        // Remove the triggers if they exist.
        triggerAddName = Names.getTrigger(newTableName, Method.add);
        triggerDelName = Names.getTrigger(newTableName, Method.del);
        triggerSetName = Names.getTrigger(newTableName, Method.set);
        results.push(this.triggerDel(triggerAddName));
        results.push(this.triggerDel(triggerDelName));
        results.push(this.triggerDel(triggerSetName));

        const triggerAddQuery = this.triggerAdd(
          Method.add,
          triggerAddName,
          newTableName,
          diffTableAdd,
          statement.columns
        );
        const triggerDelQuery: QueryParse = this.triggerAdd(
          Method.del,
          triggerDelName,
          newTableName,
          diffTableDel,
          statement.columns,
          `OLD`
        );
        const triggerSetQuery: QueryParse = this.triggerAdd(
          Method.set,
          triggerSetName,
          newTableName,
          diffTableSet,
          statement.columns
        );

        // Add the triggers.
        results.push(triggerAddQuery);
        results.push(triggerDelQuery);
        results.push(triggerSetQuery);

        results.push(this.tableRowAdd(
          newTableName,
          statement.autoKeys,
          statement.keys,
          isMemory
        ));
        /* #endregion */
        break;

      case ParseType.rename_table:
      case ParseType.modify_table_columns:
        oldTableName = statement.tablesWrite[ZERO];

        // Delete the triggers.
        triggerAddName = Names.getTrigger(oldTableName, Method.add);
        triggerDelName = Names.getTrigger(oldTableName, Method.del);
        triggerSetName = Names.getTrigger(oldTableName, Method.set);
        results.push(QueryUtils.triggerDel(triggerAddName));
        results.push(QueryUtils.triggerDel(triggerDelName));
        results.push(QueryUtils.triggerDel(triggerSetName));

        // Delete the diff tables
        diffTableAdd = Names.getDiffTable(oldTableName, Method.add);
        diffTableDel = Names.getDiffTable(oldTableName, Method.del);
        diffTableSet = Names.getDiffTable(oldTableName, Method.set);
        results.push(this.tableDel(diffTableAdd));
        results.push(this.tableDel(diffTableDel));
        results.push(this.tableDel(diffTableSet));

        // Update the table name if it is renamed.
        if (statement.type === ParseType.rename_table) {
          newTableName = statement.tablesWrite[ONE];
          results.push(QueryUtils.tableRowSet(oldTableName, newTableName));
        } else {
          newTableName = oldTableName;
        }

        /* #region Re-create the table triggers. */
        const tableCreateStatement =
          await QueryUtils.tableAdd(DB, oldTableName, newTableName);
        const newTableQueries =
          await QueryUtils.getTableModify(DB, tableCreateStatement, isMemory);
        results.push(...newTableQueries);
        /* #endregion */
        break;

      case ParseType.drop_table:
        oldTableName = statement.tablesWrite[ZERO];

        // Triggers are automatically deleted when the table is deleted.
        // Delete the diff tables.
        diffTableAdd = Names.getDiffTable(oldTableName, Method.add);
        diffTableDel = Names.getDiffTable(oldTableName, Method.del);
        diffTableSet = Names.getDiffTable(oldTableName, Method.set);
        results.push(this.tableDel(diffTableAdd));
        results.push(this.tableDel(diffTableDel));
        results.push(this.tableDel(diffTableSet));

        // Delete the table row.
        results.push(QueryUtils.tableRowDel(oldTableName));
        break;

      default:
        break;
    }

    return results;
  }

  /* #region Diff tables. */
  private static diffTableAdd(
    createTable: string,
    tableName: string,
    diffTableName: string,
  ): QueryParse {
    const query = createTable
      .replace(AS_SELECT_REGEX, STATEMENT_DELIMITER)
      .replace(tableName, diffTableName);

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

  /* #region Table rows. */
  private static tableRowAdd(
    name: string,
    autoKeys: string[],
    keys: string[],
    isMemory: boolean
  ): QueryParse {
    return new QueryParse({
      query: `REPLACE INTO ${TABLES_TABLE} VALUES (?, ?, ?, ?, ?);`,
      params: [
        name,
        JSON.stringify(autoKeys),
        JSON.stringify(keys),
        isMemory ? ONE : ZERO,
        ZERO
      ]
    });
  }

  private static tableRowDel(name: string): QueryParse {
    return new QueryParse({
      query: `DELETE FROM ${TABLES_TABLE} WHERE name = ?;`,
      params: [name]
    });
  }

  private static tableRowSet(oldName: string, newName: string): QueryParse {
    return new QueryParse({
      query: `UPDATE ${TABLES_TABLE} SET name = ? WHERE name = ?;`,
      params: [newName, oldName]
    });
  }
  /* #endregion */

  /* #region Triggers. */
  private static triggerAdd(
    method: Method,
    name: string,
    table: string,
    diffName: string,
    columns: string[],
    entity: "NEW" | "OLD" = "NEW"
  ): QueryParse {
    const columnsQuery = columns
    .map(column => `${entity}.${column}`)
      .join(`${VALUE_DELIMITER} `);

    let op: string;
    switch (method) {
      case Method.add: op = `INSERT`; break;
      case Method.set: op = `UPDATE`; break;
      case Method.del: op = `DELETE`; break;
      default: break;
    }

    const query = `CREATE TRIGGER
IF NOT EXISTS ${name}
  AFTER ${op}
  ON ${table}
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.isDiff}") IN (1)
BEGIN
  INSERT INTO ${diffName}
    VALUES (${columnsQuery});
  UPDATE ${VARS_TABLE}
    SET value = value + ${ONE}
    WHERE name = '${Variable.changeCount}';
  UPDATE ${TABLES_TABLE}
    SET changeCount = changeCount + ${ONE}
    WHERE name = '${table}';
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