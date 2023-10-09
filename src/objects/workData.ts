import FlatPromise from 'flat-promise';
import { ObjectModel } from 'objectmodel';
import { DataSource } from 'typeorm';

import { Table } from '../entities/table';
import { TABLES_TABLE, Target, VARS_TABLE, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Method } from '../utils/method';
import { Names } from '../utils/names';
import { Variable } from '../utils/variable';
import { QueryParse } from '../parser/queryParse';
import { Result } from './result';
import { ResultList } from './resultList';

class WorkDataArg {
  DB: DataSource;
}

export class WorkData {
  DB: DataSource;
  connection: any;

  private validator: LazyValidator;

  /**
   * Creates an instance of the class.
   * @param [init] @type {WorkDataArg} The initial value.
   */
  constructor(init?: WorkDataArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  private validate(): void {
    new WorkDataInit(this);
  }

  async init(): Promise<void> {
    // This is a RAW sqlite3 connection.
    // sqlite3 API: https://github.com/TryGhost/node-sqlite3/wiki/API
    const queryRunner = this.DB.createQueryRunner();
    this.connection = await queryRunner.connect();
  }

  async count(): Promise<number> {
    const result = await this.DB.query(
      `SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.changeCount}";`
    );
    return parseInt(result[ZERO].value);
  }

  async load(
    commitID: number,
    target: Target,

    isRaw = false,
    statement: QueryParse = undefined,
    queryName: string = undefined
  ): Promise<ResultList> {
    if (isRaw && statement == undefined) { return undefined; }

    switch (isRaw) {
      case true: return await this.loadRaw(
        commitID,
        statement,
        queryName
      );

      case false: return await this.loadDiff(commitID, target);
    }
  }

  async save(resultList: ResultList): Promise<void> {
    const queries: string[] = [];
    const params: any[] = [];

    for (const rawQuery of resultList.toUpdate()) {
      queries.push(rawQuery.query);
      params.push(...rawQuery.params);
    }

    const finalQuery = queries.join(` `);

    await this.DB.query(finalQuery, params);
  }

  async loadDiff(
    commitID: number,
    _target: Target,
    memTables: string[] = undefined
  ): Promise<ResultList> {
    const resultList: ResultList = new ResultList({
      id: commitID,

      resultsAdd: [],
      resultsDel: [],
      resultsSet: [],

      resultsGet: [],

      error: undefined,
      isCancel: false,
      isWait: false
    });

    // Get the overall change count.
    const allCount = await this.DB.manager
      .query(`
        SELECT value FROM ${VARS_TABLE}
          WHERE name = '${Variable.changeCount}';
      `);

    if (allCount === ZERO) { return resultList; }

    // Get the relevant tables.
    const tables: {
      name: string;
      autoKeys: string;
      keys: string;
    }[] = await this.DB.manager
      .query(`
        SELECT name, autoKeys, keys FROM ${TABLES_TABLE}
          WHERE changeCount > ${ZERO};
      `);

    // Create the mem tables set if necessary.
    let memTablesSet: Set<string>;
    if (memTables != undefined) {
      memTablesSet = new Set<string>(memTables);
    }

    // Loop through the tables.
    for (const table of tables) {
      // Skip any tables that are not in the mem tables.
      if (memTables != undefined && !memTablesSet.has(table.name)) {
        continue;
      }

      /* #region Create a new results. */
      const resultAdd: Result = new Result({
        name: table.name,
        autoKeys: JSON.parse(table.autoKeys),
        keys: JSON.parse(table.keys),
        method: Method.add,
        rows: [],
      });
      const resultDel: Result = new Result({
        name: table.name,
        autoKeys: JSON.parse(table.autoKeys),
        keys: JSON.parse(table.keys),
        method: Method.del,
        rows: [],
      });
      const resultSet: Result = new Result({
        name: table.name,
        autoKeys: JSON.parse(table.autoKeys),
        keys: JSON.parse(table.keys),
        method: Method.set,
        rows: [],
      });
      /* #endregion */

      // Get the trigger names.
      const diffAdd = Names.getDiffTable(resultAdd.name, Method.add);
      const diffDel = Names.getDiffTable(resultAdd.name, Method.del);
      const diffSet = Names.getDiffTable(resultAdd.name, Method.set);

      /* #region Get the trigger content. */
      resultAdd.rows = await this.DB
        .query(`SELECT * FROM ${diffAdd};`);
      resultDel.rows = await this.DB
        .query(`SELECT * FROM ${diffDel};`);
      resultSet.rows = await this.DB
        .query(`SELECT * FROM ${diffSet};`);
      /* #endregion */

      /* #region Add the results. */
      if (resultAdd.rows.length > ZERO) {
        resultList.resultsAdd.push(resultAdd);
      }
      if (resultDel.rows.length > ZERO) {
        resultList.resultsDel.push(resultDel);
      }
      if (resultSet.rows.length > ZERO) {
        resultList.resultsSet.push(resultSet);
      }
      /* #endregion */
    }

    return resultList;
  }

  async loadRaw(
    commitID: number,

    statement: QueryParse,
    queryName: string
  ): Promise<ResultList> {
    const resultList: ResultList = new ResultList({
      id: commitID,

      resultsAdd: [],
      resultsDel: [],
      resultsSet: [],

      resultsGet: [],

      error: undefined,
      isCancel: false,
      isWait: false
    });

    // Get the relevant tables.
    const resultPromise = new FlatPromise();
    await this
      .connection
      .all(
        statement.query,
        statement.params,
        (err: any, rows: any) => {
          if (err) {
            resultPromise.reject(err);
            return;
          }

          resultPromise.resolve(rows);
        }
    );
    const result = await resultPromise.promise;

    // Quit early if there are no results.
    if (!result || !result.length) {
      return resultList;
    }

    // Add the results.
    resultList.resultsGet.push(new Result({
      name: queryName,
      autoKeys: [],
      keys: [],
      method: Method.get,
      rows: result,
    }));

    return resultList;
  }

  async tare(isTotal = false): Promise<void> {
    // Get the relevant tables.
    const tables: string[] = (await this.DB.manager
      .query(`SELECT name FROM ${TABLES_TABLE} WHERE changeCount > ${ZERO};`))
      .map((table: Partial<Table>) => table.name);

    // Reset the change count.
    await this.DB.manager
      .query(`UPDATE ${TABLES_TABLE} SET changeCount = ${ZERO};`);

    // Tare the trigger tables.
    for (const table of tables) {
      const diffAdd = Names.getDiffTable(table, Method.add);
      const diffDel = Names.getDiffTable(table, Method.del);
      const diffSet = Names.getDiffTable(table, Method.set);

      await this.DB.manager.query(WorkData.diffDelRows(diffAdd));
      await this.DB.manager.query(WorkData.diffDelRows(diffDel));
      await this.DB.manager.query(WorkData.diffDelRows(diffSet));
    }

    // Reset the overall change count variable.
    if (isTotal) {
      await this.DB.manager.query(`
        UPDATE ${VARS_TABLE} 
          SET value = ${ZERO}
          WHERE name = '${Variable.changeCount}';`
      );
    }

  }

  private static diffDelRows(name: string): string {
    return `DELETE FROM ${name};`;
  }
}

const WorkDataInit = new ObjectModel({
  DB: DataSource,
});