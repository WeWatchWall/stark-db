import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { LazyValidator } from '../utils/lazyValidator';

class ResultArg {
  name: string;
  rows: any[];
}

export class Result {
  validator: LazyValidator;

  name: string;
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
      rows: this.rows,
    };
  }
}

/* #region  Use schema to check the properties. */
const StatementInitArg = new ObjectModel({
  name: String,
  rows: ArrayModel(Any),
});
/* #endregion */