import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { LazyValidator } from '../utils/lazyValidator';

class QueryRawArg {
  query: string;
  params: any[];
}

export class QueryRaw {
  validator: LazyValidator;

  query: string;
  params: any[];

  /**
   * Creates an instance of the class.
   * @param [init] @type {QueryRawArg} The initial value.
   */
  constructor(init?: QueryRawArg) {
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
    new QueryRawInitArg(this);
  }

  toObject(): QueryRawArg {
    return {
      query: this.query,
      params: this.params,
    };
  }
}

const QueryRawInitArg = new ObjectModel({
  query: String,
  params: ArrayModel(Any),
});