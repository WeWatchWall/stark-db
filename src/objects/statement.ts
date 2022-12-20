import assert from 'assert';
import { Any, ArrayModel, BasicModel, ObjectModel } from 'objectmodel';
import RecursiveIterator from 'recursive-iterator';
import sqliteParser from 'sqlite-parser';

import { ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';

export enum ParseType {
  begin_transaction = 0,
  rollback_transaction = 1,
  commit_transaction = 2,

  create_table = 3,
  rename_table = 4,
  modify_table_columns = 5,
  drop_table = 6,

  modify_data = 7,
  select_data = 8,

  other = 9,
}

enum StatementType {
  begin = 0,
  rollback = 1,
  commit = 2,
  end = 3,

  create = 4,
  rename = 5,
  drop = 6,

  add = 7,

  insert = 8,
  update = 9,
  select = 10,
  delete = 11,
}

class StatementArg {
  index: number;
  statement: string;
  params: any[];
}

// TODO: Add support for the following:
// - WITH PREFIX TO DATA QUERIES

// - CREATE INDEX
// - CREATE TRIGGER
// - CREATE VIEW

// - SCHEMA NAME
// - ATTACH DB
export class Statement {
  validator: LazyValidator;

  index: number;
  statement: string;
  params: any[];

  meta: any;
  type: ParseType;
  isRead: boolean;
  tables: string[];

  isTransaction: boolean;

  /**
   * Creates an instance of a SQL statement.
   * @param [init] @type {StatementArg} The initial values.
   */
  constructor(init?: StatementArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.statement = this.statement?.trim();
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
    this.parseIsRead();
    this.parseTables();
  }

  private parseType() {
    const transactionActions = [
      StatementType[0],
      StatementType[1],
    ];

    const transactionEndActions = [
      StatementType[2],
      StatementType[3],
    ];

    const columnModifyActions = [
      StatementType[7],
      StatementType[6]
    ];

    const dataModifyActions = [
      StatementType[8],
      StatementType[9],
      StatementType[11],
    ];

    if (transactionActions.includes(this.meta.action)) {
      this.type = <ParseType>(<any>StatementType[this.meta.action]);

    } else if (transactionEndActions.includes(this.meta.action)) {
      this.type = ParseType.commit_transaction;

    } else if (
      this.meta.format === `table` &&
      this.meta.variant === StatementType[4]
    ) {
      this.type = ParseType.create_table;

    } else if (this.meta.action === StatementType[5]) {
      this.type = ParseType.rename_table;

    } else if (
      columnModifyActions.includes(this.meta.action)
    ) {
      this.type = ParseType.modify_table_columns;
    } else if (
      this.meta.format === `table` &&
      this.meta.variant === StatementType[6]
    ) {
      this.type = ParseType.drop_table;

    } else if (dataModifyActions.includes(this.meta.variant)) {
      this.type = ParseType.modify_data;

    } else if (this.meta.variant === StatementType[10]) {
      this.type = ParseType.select_data;

    } else {
      this.type = ParseType.other;
    }

    // Detect if the statement is a write with a read.
    this.isRead = (
      this.type === ParseType.create_table &&
      this.meta.definition?.[ZERO]?.type === `statement` &&
      this.meta.definition?.[ZERO]?.variant === StatementType[10]
    ) || (
      this.type === ParseType.modify_data &&
      this.meta.result?.type === `statement` &&
      this.meta.result?.variant === StatementType[10]
    );
  }

  private parseIsRead(): void {
    let iterator = new RecursiveIterator(
      this.meta,
      1, // Breath-first.
    );

    for(let { node } of iterator) {
      if (
        node.type === `statement` &&
        node.variant === StatementType[10]
      ) {
        this.isRead = true;
        break;
      }      
    }
  }

  private parseTables(): void {

    const tableActions = [
      ParseType.create_table,
      ParseType.rename_table,
      ParseType.modify_table_columns,
      ParseType.drop_table,
    ];

    const dataActions = [
      ParseType.modify_data,
      ParseType.select_data,
    ];

    this.tables = [];
    if (tableActions.includes(this.type) || dataActions.includes(this.type)) {
      this.tables = this.parseDataTables();
    }
  }

  private parseDataTables(): string[] {
    const tables = new Set<string>();

    let iterator = new RecursiveIterator(
      this.meta,
      1, // Breath-first.
    );

    for(let { node } of iterator) {
      const conditions = [
        node.type === `identifier`,
        node.variant === `table`,
        !!node.name
      ];

      if (conditions.includes(false)) { continue; }

      tables.add(node.name);
    }

    return Array.from(tables);
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
  params: ArrayModel(Any)
});
/* #endregion */