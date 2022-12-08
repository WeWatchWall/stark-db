import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import {
  PARAMETER_TOKEN,
  STATEMENT_DELIMITER,
  Target,
  VALUE_DELIMITER,
  ZERO
} from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Update } from './update';

/* #region  Single result. */
class ResultArg {
  name: string;
  keys: string[];
  rows: any[];
}

export class Result {
  validator: LazyValidator;

  name: string;
  keys: string[];
  rows: any[];

  /**
   * Creates an instance of the class.
   * @param [init] @type {ResultArg} The initial value.
   */
  constructor(init?: ResultArg) {
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
    new ResultInitArg(this);
  }

  toIDObject(): ResultArg {
    // Loop through the rows and return the IDs.
    const rows = this.rows.map((row) => {
      const result = {};

      // Each ID can be multiple columns.
      this.keys.forEach((key) => {
        result[key] = row[key];
      });

      return result;
    });

    return {
      name: this.name,
      keys: this.keys,
      rows: rows,
    };
  }

  toObject(): ResultArg {
    return {
      name: this.name,
      keys: this.keys,
      rows: this.rows,
    };
  }

  toUpdate(): Update {
    const queryParts: string[] = [
      `INSERT OR REPLACE INTO ${this.name} VALUES `,
    ];
    const queryParams: any[] = [];

    let rowKeys: string[];
    for (let index = 0; index <this.rows.length; index++) {
      const row = this.rows[index];
      if (rowKeys == undefined) { rowKeys = Object.keys(row); }
      const rowParts: string[] = [];

      for (const key of rowKeys) {
        rowParts.push(PARAMETER_TOKEN);
        queryParams.push(row[key]);
      }

      const rowDelimiter = index === ZERO ? `` : VALUE_DELIMITER;
      queryParts.push(`${rowDelimiter}(${rowParts.join(VALUE_DELIMITER)})`);
    }

    queryParts.push(STATEMENT_DELIMITER);

    return new Update({
      query: queryParts.join(``),
      params: queryParams,
    });
  }
}

/* #region  Use schema to check the properties. */
const ResultInitArg = new ObjectModel({
  name: String,
  keys: ArrayModel(String),
  rows: ArrayModel(Any),
});
/* #endregion */
/* #endregion */

/* #region  Multiple results. */
class ResultsArg {
  id: number;
  target: Target;
  isWrite: boolean;
  isLong: boolean;
  results: Result[] | ResultArg[];
}

export class Results {
  validator: LazyValidator;

  id: number;
  target: Target;
  isWrite: boolean;
  isLong: boolean;
  results: Result[];

  static init(obj: ResultsArg): Results {
    if (!obj) { return undefined; }

    // Copy the arguments and parse the results property.
    const arg = Object.assign({}, obj);
    arg.results =
      arg
        .results
        ?.map((result: ResultArg) => new Result(result))
      || [];

    return new Results(arg);
  }

  /**
   * Creates an instance of the class.
   * @param [init] @type {ResultsArg} The initial value.
   */
   constructor(init?: ResultsArg) {
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
    new ResultsInitArg(this);
  }

  toIDObject(): ResultsArg {
    return {
      id: this.id,
      isWrite: this.isWrite,
      isLong: this.isLong,
      target: this.target,
      results: this.results?.map((result) => result.toIDObject()) || [],
    };
  }

  toObject(): ResultsArg {
    return {
      id: this.id,
      isWrite: this.isWrite,
      isLong: this.isLong,
      target: this.target,
      results: this.results?.map((result) => result.toObject()) || [],
    };
  }

  toUpdate(): Update[] {
    return this.results?.map((result) => result.toUpdate()) || [];
  }
}

/* #region  Use schema to check the properties. */
const ResultsInitArg = new ObjectModel({
  id: Number,
  target: [Target.DB, Target.mem],
  isWrite: Boolean,
  isLong: Boolean,
  results: [ArrayModel(Result), ArrayModel(ResultArg)],
});
/* #endregion */
/* #endregion */