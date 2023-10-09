import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import shortHash from "shorthash2";

import { ONE, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Method } from '../utils/method';
import { QueryRaw } from '../parser/queryRaw';
import { Result, ResultArg } from './result';

/* #region  Multiple results. */
export class ResultListArg {
  id: number;

  resultsAdd?: Result[] | ResultArg[];
  resultsDel?: Result[] | ResultArg[];
  resultsSet?: Result[] | ResultArg[];

  resultsGet?: Result[] | ResultArg[];

  error: any;
  isCancel: boolean;
  isWait: boolean;
}

export class ResultList {
  validator: LazyValidator;

  id: number;

  resultsAdd: Result[];
  resultsDel: Result[];
  resultsSet: Result[];

  resultsGet: Result[];

  error: any;
  isCancel: boolean;
  isWait: boolean;

  static init(obj: ResultListArg): ResultList {
    if (!obj) { return undefined; }

    /* #region Copy the arguments and parse the results property. */
    const arg = Object.assign({}, obj);
    arg.resultsAdd = arg.resultsAdd
      ?.map((result: ResultArg) => new Result(result))
      || [];
    arg.resultsDel = arg.resultsDel
      ?.map((result: ResultArg) => new Result(result))
      || [];
    arg.resultsSet = arg.resultsSet
      ?.map((result: ResultArg) => new Result(result))
      || [];
    /* #endregion */

    return new ResultList(arg);
  }

  static isIntersect(list: ResultList, newList: ResultList): boolean {
    // ResultsAdd don't intersect due to the auto-incremented or
    //   externally - managed id.

    /* #region Check the results' stats. */
    const listStats = Math.max(
      list.resultsDel.length,
      list.resultsSet.length
    );
    const newListStats = Math.max(
      newList.resultsDel.length,
      newList.resultsSet.length
    );

    if (listStats === ZERO || newListStats === ZERO) { return false; }
    /* #endregion */

    // Create the data structure.
    const tables: {
      [key: string]: {
        name: string;
        keys: string[];
        rows: { [key: string]: any }
      }
    } = {};

    /* #region  Parse the existing tables. */
    const results = list.resultsDel.concat(list.resultsSet);
    for (const result of results) {

      // Create the table if it doesn't exist.
      if (!tables[result.name]) {
        const table = {
          name: result.name,
          keys: result.keys,
          rows: {},
        };
        tables[result.name] = table;
      }

      const table = tables[result.name];

      // Loop over the rows.
      for (const row of result.rows) {
        const keyData: any[] = [];
        for (const key of result.keys) {
          keyData.push(row[key]);
        }

        // Hash the key and store the row.
        const key = shortHash(JSON.stringify(keyData));
        table.rows[key] = row;
      }
    }
    /* #endregion */

    /* #region  Check the new tables. */
    const newResults =
      newList.resultsDel.concat(newList.resultsSet);
    for (const result of newResults) {

      // Create the table if it doesn't exist.
      if (!tables[result.name]) {
        continue;
      }

      const table = tables[result.name];

      // Loop over the rows.
      for (const row of result.rows) {
        const keyData: any[] = [];
        for (const key of result.keys) {
          keyData.push(row[key]);
        }

        // Hash the key and store the row.
        const key = shortHash(JSON.stringify(keyData));
        if (!table.rows[key]) { continue; }

        return true;
      }
    }
    /* #endregion */

    return false;
  }

  static merge(...lists: ResultList[]): ResultList {
    /* #region  Create the result list. */
    const results = new ResultList({
      id: -ONE,

      resultsAdd: [],
      resultsDel: [],
      resultsSet: [],

      resultsGet: [],

      error: undefined,
      isCancel: false,
      isWait: false,
    });

    // Filter out any undefined lists.
    lists = lists.filter((list) => !!list);

    if (!lists || !lists.length) { return results; }
    else if (lists.length === ONE) { return lists[ZERO]; }
    else if (lists.length > ONE) {
      results.id = lists[lists.length - ONE].id;
    }
    /* #endregion */

    /* #region Merge the different collections of results. */
    results.resultsAdd = ResultList.mergeResults(
      lists.map((list) => list.resultsAdd).flat(),
      Method.add
    );
    results.resultsDel = ResultList.mergeResults(
      lists.map((list) => list.resultsDel).flat(),
      Method.del
    );
    results.resultsSet = ResultList.mergeResults(
      lists.map((list) => list.resultsSet).flat(),
      Method.set
    );

    results.resultsGet = lists.map((list) => list.resultsGet).flat();

    results.isCancel = lists.some((list) => list.isCancel);
    results.isWait = lists.some((list) => list.isWait);
    /* #endregion */

    return results;
  }

  private static mergeResults(
    resultArgs: Result[] | ResultArg[],
    method: Method
  ): Result[] {
    const results: Result[] = [];
    if (!resultArgs || !resultArgs.length) { return results; }

    // Create the data structure.
    const tables: {
      [key: string]: {
        name: string;
        autoKeys: string[];
        keys: string[];
        rows: { [key: string]: any }
      }
    } = {};

    // Parse the list of results.
    for (const arg of resultArgs) {
      // Create the table if it doesn't exist.
      if (!tables[arg.name]) {
        const table = {
          name: arg.name,
          autoKeys: arg.autoKeys,
          keys: arg.keys,
          rows: {},
        };
        tables[arg.name] = table;
      }

      const table = tables[arg.name];

      // Loop over the rows.
      for (const row of arg.rows) {
        const keyData: any[] = [];
        for (const key of arg.keys) {
          keyData.push(row[key]);
        }

        // Hash the key and store the row.
        const key = shortHash(JSON.stringify(keyData));
        table.rows[key] = row;
      }
    }

    // Write out the tables.
    for (const name in tables) {
      const table = tables[name];

      // Add each row to the results.
      results.push(new Result({
        name,
        autoKeys: table.autoKeys,
        keys: table.keys,
        method,
        rows: Object.values(table.rows),
      }));
    }

    return results;
  }

  /**
   * Creates an instance of the class.
   * @param [init] @type {ResultListArg} The initial value.
   */
  constructor(init?: ResultListArg) {
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
    new ResultListInitArg(this);
  }

  toObject(): ResultListArg {
    return {
      id: this.id,

      resultsAdd: this.resultsAdd.map((result) => result.toObject()),
      resultsDel: this.resultsDel.map((result) => result.toObject()),
      resultsSet: this.resultsSet.map((result) => result.toObject()),

      resultsGet: this.resultsGet.map((result) => result.toObject()),

      error: this.error,
      isCancel: this.isCancel,
      isWait: this.isWait,
    };
  }

  toObjectDiff(): ResultListArg {
    return {
      id: this.id,

      resultsAdd: this.resultsAdd.map((result) => result.toObject()),
      resultsDel: this.resultsDel.map((result) => result.toObject()),
      resultsSet: this.resultsSet.map((result) => result.toObject()),

      resultsGet: [],

      error: this.error,
      isCancel: this.isCancel,
      isWait: this.isWait,
    };
  }
  
  toObjectGet(): ResultListArg {
    return {
      id: this.id,

      resultsAdd: [],
      resultsDel: [],
      resultsSet: [],

      resultsGet: this.resultsGet.map((result) => result.toObject()),

      error: this.error,
      isCancel: this.isCancel,
      isWait: this.isWait,
    };
  }

  toUpdate(): QueryRaw[] {
    const results: QueryRaw[] = [];

    results.push(...this.resultsAdd.map((result) => result.toUpdate()));
    results.push(...this.resultsSet.map((result) => result.toUpdate()));

    // Deletions happen last.
    results.push(...this.resultsDel.map((result) => result.toUpdate()));

    return results;
  }
}

// Use schema to check the properties.
const ResultListInitArg = new ObjectModel({
  id: Number,

  resultsAdd: [ArrayModel(Any)],
  resultsDel: [ArrayModel(Any)],
  resultsSet: [ArrayModel(Any)],

  resultsGet: [ArrayModel(Any)],
});
/* #endregion */