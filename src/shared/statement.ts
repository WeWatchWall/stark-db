import assert from 'assert';
import { BasicModel, ObjectModel } from 'objectmodel';
import sqliteParser from 'sqlite-parser';

import { ZERO } from './constants';
import { LazyValidator } from './lazyValidator';

export enum ParseType {
  begin_transaction,
  rollback_transaction,
  commit_transaction,

  create_table,
  modify_table,

  modify_data,
  select_data,

  other,
}

enum StatementType {
  begin,
  rollback,
  commit,

  create,
  alter,
  drop,

  insert,
  update,
  select,
  delete,
}

class StatementData {
  index: number;
  statement: string;
}

export class Statement {
  validator: LazyValidator;

  index: number;
  statement: string;
  meta: any;

  type: ParseType;
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

    const parseResult = sqliteParser(this.statement);
    this.meta = parseResult
      ?.statement
      ?.[0];

    assert(this.meta, `Failed to parse the statement.`);
    assert( // TODO: Might be unnecessary. 
      this.meta.type === `statement`,
      `Failed to parse the statement metadata type.`
    );
  }

  private ready(): void {
    this.parseType();
  }

  private parseType() {
    const transactionActions = [
      StatementType[0],
      StatementType[1],
      StatementType[2],
    ];

    const tableModifyActions = [
      StatementType[4],
      StatementType[5],
    ];

    const dataModifyActions = [
      StatementType[6],
      StatementType[7],
      StatementType[9],
    ];

    if (transactionActions.includes(this.meta.action)) {
      this.type = <ParseType>(<any>StatementType[this.meta.action]);

    } else if (this.meta.format === `table` &&
      this.meta.variant === StatementType[3]) {
      this.type = ParseType.create_table;

    } else if (this.meta.format === `table` &&
      tableModifyActions.includes(this.meta.variant)) {
      this.type = ParseType.modify_table;

    } else if (dataModifyActions.includes(this.meta.variant)) {
      this.type = ParseType.modify_data;

    } else if (this.meta.action === StatementType[8]) {
      this.type = ParseType.select_data;

    } else {
      this.type = ParseType.other;
    }
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
});
/* #endregion */