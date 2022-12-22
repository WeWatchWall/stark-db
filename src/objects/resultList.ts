import { ArrayModel, ObjectModel } from 'objectmodel';

import { Target } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Query } from './query';
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

  toUpdate(): Query[] {
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