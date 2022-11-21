import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { LazyValidator } from '../utils/lazyValidator';

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
   * Creates an instance of a SQL results.
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
    new StatementInitArg(this);
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

      // Use JSON to avoid any issues with the key values.
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
const StatementInitArg = new ObjectModel({
  name: String,
  keys: ArrayModel(String),
  rows: ArrayModel(Any),
});
/* #endregion */