import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { LazyValidator } from '../utils/lazyValidator';

class RawQueryArg {
  query: string;
  params: any[];
}

export class RawQuery {
  validator: LazyValidator;

  query: string;
  params: any[];

  /**
   * Creates an instance of the class.
   * @param [init] @type {RawQueryArg} The initial value.
   */
  constructor(init?: RawQueryArg) {
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
    new QueryInitArg(this);
  }

  toObject(): RawQueryArg {
    return {
      query: this.query,
      params: this.params,
    };
  }
}

const QueryInitArg = new ObjectModel({
  query: String,
  params: ArrayModel(Any),
});