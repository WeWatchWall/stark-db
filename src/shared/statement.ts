import { Any, BasicModel, ObjectModel } from 'objectmodel';
import { ZERO } from './constants';

import { LazyValidator } from './lazyValidator';

export enum StatementType {
  BEGIN = 'BEGIN',
  ROLLBACK = 'ROLLBACK',
  COMMIT = 'COMMIT',

  CREATE_TABLE = 'CREATE_TABLE',
  ALTER_TABLE = 'ALTER_TABLE',
  DROP_TABLE = 'DROP_TABLE',

  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  SELECT = 'SELECT',
  DELETE = 'DELETE',

  OTHER = 'OTHER',
}

class StatementData {
  index: number;
  statement: string;
  meta: any;
}

export class Statement {
  validator: LazyValidator;

  index: number;
  statement: string;
  meta: any;

  type: StatementType;
  isTransaction: boolean;

  /**
   * Creates an instance of a SQL statement.
   * @param [init] @type {StatementData} The initial values.
   */
   constructor(init?: StatementData) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init !== undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  private validate(): void {
    new StatementInitArg(this);
  }

  private ready(): void {
    
  }


  /**
   * Gets the string representation of the instance.
   * @returns string
   * @memberof Statement
   */
  toString(): string {
    return this.statement;
  }
}

/* #region  Use schema to check the properties. */
const Integer = BasicModel(Number)
  .assert(Number.isSafeInteger)
  .as("Integer");
const PositiveInteger = Integer
  .assert(function isPositive(n) { return n >= ZERO })
  .as("PositiveInteger");
const StatementInitArg = new ObjectModel({
  index: PositiveInteger,
  statement: String,
  meta: Any,
});
/* #endregion */