import { ObjectModel } from 'objectmodel';
import { DataSource } from 'typeorm';

import { ONE, SELECT_RESULT, TABLES_TABLE, Target, TRIGGER_PREFIX, VARS_TABLE, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Variable } from '../utils/variable';
import { QueryParse } from './queryParse';
import { ResultList } from './resultList';
import { Result } from './result';

class WorkCommitArg {
  DB: DataSource;
}

export class WorkCommit {
  DB: DataSource;

  private validator: LazyValidator;

  /**
   * Creates an instance of the class.
   * @param [init] @type {WorkCommitArg} The initial value.
   */
  constructor(init?: WorkCommitArg) {
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
    new WorkCommitInit(this);
  }

  async load(
    commitID: number,
    target: Target,
    isLong: boolean,

    isRaw = false,
    statement: QueryParse = undefined,
    queryName: string = undefined
  ): Promise<ResultList> {
    if (isRaw && statement == undefined) { return undefined; }

    switch (isRaw) {
      case true: return await this.loadRaw(
        commitID,
        target,
        isLong,
        statement,
        queryName
      );

      case false: return await this.loadDiff(commitID, target, isLong);
    }
  }

  async save(resultList: ResultList): Promise<void> {
    const queries: string[] = [];
    const params: any[] = [];

    for (const result of resultList.results) {
      if (result.name.startsWith(SELECT_RESULT)) {
        continue;
      }

      const rawQuery = result.toUpdate();
      queries.push(rawQuery.query);
      params.push(...rawQuery.params);
    }

    const finalQuery = queries.join(` `);

    // Disable the triggers.
    await this.DB.manager.query(`
      UPDATE ${TABLES_TABLE} SET ${Variable.isWAL} = ${ZERO};
    `);

    await this.DB.manager.query(finalQuery, params);

    // Re-enable the triggers.
    await this.DB.manager.query(`
      UPDATE ${TABLES_TABLE} SET ${Variable.isWAL} = ${ONE};
    `);
  }

  async loadDiff(
    commitID: number,
    target: Target,
    isLong: boolean
  ): Promise<ResultList> {
    const resultList: ResultList = new ResultList({
      id: commitID,
      target: target,
      isLong: isLong,
      results: [],
    });

    // Get the overall change count.
    const allCount = await this.DB.manager
      .query(`
        SELECT value FROM ${VARS_TABLE}
          WHERE name = '${Variable.changeCount}';
      `);

    if (allCount === ZERO) { return resultList; }

    // Get the relevant tables.
    const tables: [string, string][] = await this.DB.manager
      .query(`
        SELECT name, keys FROM ${TABLES_TABLE}
          WHERE changeCount > ${ZERO};
      `);

    // Loop through the tables.
    for (const table of tables) {
      // Create a new result.
      const result: Result = new Result({
        name: table[ZERO],
        keys: JSON.parse(table[ONE]),
        rows: [],
      });
      
      result.rows = await this.DB.manager
        .query(`SELECT * FROM ${TRIGGER_PREFIX}${result.name};`);
      
      // Add the result.
      resultList.results.push(result);
    }

    return resultList;
  }

  async loadRaw(
    commitID: number,
    target: Target,
    isLong: boolean,

    statement: QueryParse,
    queryName: string
  ): Promise<ResultList> {
    const resultList: ResultList = new ResultList({
      id: commitID,
      target: target,
      isLong: isLong,
      results: [],
    });

    // Get the relevant tables.
    const result: any = await this.DB.manager
      .query(statement.query, statement.params);
    
    // Add the results.
    if (!!result) {
      resultList.results.push(new Result({
        name: queryName,
        keys: [],
        rows: result,
      }));
    }

    return resultList;
  }

  async tare(isLong = false): Promise<void> {
    if (!isLong) { return; }

    // Get the relevant tables.
    const tables: string[] = await this.DB.manager
      .query(`SELECT name FROM ${TABLES_TABLE} WHERE changeCount > ${ZERO};`);
    
    // Reset the change count.
    await this.DB.manager
      .query(`UPDATE ${TABLES_TABLE} SET changeCount = ${ZERO};`);
    
    // Tare the trigger tables.
    for (const table of tables) {
      await this.DB.manager
        .query(`DELETE FROM ${TRIGGER_PREFIX}${table};`);
    }

    // Reset the overall change count variable.
    await this.DB.manager
      .query(`
        UPDATE ${VARS_TABLE} 
          SET value = ${ZERO}
          WHERE name = '${Variable.changeCount}';
      `);
  }

  destroy(): void {
    delete this.DB;
  }
}

const WorkCommitInit = new ObjectModel({
  DB: DataSource,
});