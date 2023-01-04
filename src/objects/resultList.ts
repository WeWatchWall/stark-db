import { ArrayModel, ObjectModel } from 'objectmodel';
import shortHash from "shorthash2";

import { ONE, Target, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { QueryRaw } from './queryRaw';
import { Result, ResultArg } from './result';

/* #region  Multiple results. */
export class ResultListArg {
  id: number;
  target: Target;

  isLong: boolean;
  results?: Result[] | ResultArg[];
}

export class ResultList {
  validator: LazyValidator;

  id: number;
  target: Target;

  isLong: boolean;
  results: Result[];

  static init(obj: ResultListArg): ResultList {
    if (!obj) { return undefined; }

    // Copy the arguments and parse the results property.
    const arg = Object.assign({}, obj);
    arg.results =
      arg
        .results
        ?.map((result: ResultArg) => new Result(result))
      || [];

    return new ResultList(arg);
  }

  static isIntersect(list: ResultList, newList: ResultList): boolean {
    // Create data structure.
    const tables: {
      [key: string]: {
        name: string;
        keys: string[];
        rows: { [key: string]: any }
      }
    } = {};

    /* #region  Parse the existing tables. */
    for (const result of list.results) {

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
    for (const result of newList.results) {

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
    const results = new ResultList({
      id: -ONE,
      target: Target.DB,
      isLong: false,
      results: [],
    });

    if (lists.length > ZERO) {
      results.id = lists[lists.length - ONE].id;
      results.target = lists[ZERO].target;
      results.isLong = lists[ZERO].isLong;
    }

    // Create data structure.
    const tables: {
      [key: string]: {
        name: string;
        keys: string[];
        rows: { [key: string]: any }
      }
    } = {};

    /* #region  Parse the result lists. */
    for (const list of lists) {

      // Loop through the tables.
      for (const result of list.results) {

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
    }
    /* #endregion */

    /* #region  Write out the tables. */
    for (const name in tables) {
      const table = tables[name];

      // Add each row to the results.
      results.results.push(new Result({
        name,
        keys: table.keys,
        rows: Object.values(table.rows),
      }));
    }
    /* #endregion */

    return results
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

  toHashObject(): ResultListArg {
    return {
      id: this.id,
      target: this.target,

      isLong: this.isLong,
      results: this.results.map((result) => result.toHashObject()),
    };
  }

  toIDObject(): ResultListArg {
    return {
      id: this.id,
      target: this.target,

      isLong: this.isLong,
      results: this.results.map((result) => result.toIDObject()),
    };
  }

  toObject(): ResultListArg {
    return {
      id: this.id,
      target: this.target,

      isLong: this.isLong,
      results: this.results.map((result) => result.toObject()),
    };
  }

  toUpdate(): QueryRaw[] {
    return this.results.map((result) => result.toUpdate());
  }
}

/* #region  Use schema to check the properties. */
const ResultListInitArg = new ObjectModel({
  id: Number,
  target: [Target.DB, Target.mem],

  isLong: Boolean,
  results: [ArrayModel(Result), ArrayModel(ResultArg)],
});
/* #endregion */
/* #endregion */