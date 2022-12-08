import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { LazyValidator } from '../utils/lazyValidator';

export class UpdateArg {
  query: string;
  params: any[];
}

export class Update {
  validator: LazyValidator;

  query: string;
  params: any[];

  /**
   * Creates an instance of the class.
   * @param [init] @type {UpdateArg} The initial value.
   */
  constructor(init?: UpdateArg) {
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
    new UpdateInitArg(this);
  }
}

const UpdateInitArg = new ObjectModel({
  query: String,
  params: ArrayModel(Any),
});