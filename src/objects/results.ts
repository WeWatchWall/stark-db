import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { Target } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';

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
   * Creates an instance of a SQL result.
   * @param [init] @type {ResultArg} The initial values.
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

  toObject(): ResultArg {
    return {
      name: this.name,
      keys: this.keys,
      rows: this.rows,
    };
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
  results?: Result[] | ResultArg[];
}

export class Results {
  validator: LazyValidator;

  id: number;
  target: Target;
  isWrite: boolean;
  isLong: boolean;
  results?: Result[];

  static init(obj: ResultsArg): Results {
    obj.results = obj.results.map((result: ResultArg) => new Result(result));
    return new Results(obj);
  }

  /**
   * Creates an instance of a SQL results.
   * @param [init] @type {ResultsArg} The initial values.
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

  toObject(): ResultsArg {
    return {
      id: this.id,
      isWrite: this.isWrite,
      isLong: this.isLong,
      target: this.target,
      results: this.results.map((result) => result.toObject()),
    };
  }
}

/* #region  Use schema to check the properties. */
const ResultsInitArg = new ObjectModel({
  id: Number,
  target: [Target.DB, Target.mem],
  isWrite: Boolean,
  isLong: Boolean,
  results: [undefined, ArrayModel(Result), ArrayModel(ResultArg)],
});
/* #endregion */
/* #endregion */