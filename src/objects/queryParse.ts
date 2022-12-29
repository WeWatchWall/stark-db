import assert from 'assert';
import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import RecursiveIterator from 'recursive-iterator';
import sqliteParser from 'sqlite-parser';

import { ONE, ZERO } from '../utils/constants';
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

enum QueryType {
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

export class QueryParseArg {
  query: string;
  params: any[];

  type?: ParseType;
  isRead?: boolean;
  tables?: string[];
  columns?: string[];
  keys?: string[];
}

// TODO: Add support for the following:
// - WITH PREFIX TO DATA QUERIES

// - CREATE INDEX
// - CREATE TRIGGER
// - CREATE VIEW

// - SCHEMA NAME
// - ATTACH DB
export class QueryParse {
  validator: LazyValidator;

  query: string;
  params: any[];

  type: ParseType;
  isRead: boolean;
  tables: string[];
  columns: string[];
  keys: string[];

  private meta: any;

  /**
   * Creates an instance of a SQL statement.
   * @param [init] @type {QueryParseArg} The initial values.
   */
  constructor(init?: QueryParseArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.query = this.query?.trim();
      this.validator.valid();
    }
  }

  private validate(): void {
    new QueryParseInitArg(this);

    const parseResult = sqliteParser(this.query);
    this.meta = parseResult
      ?.statement
      ?.[ZERO];

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
      QueryType[0],
      QueryType[1],
    ];

    const transactionEndActions = [
      QueryType[2],
      QueryType[3],
    ];

    const columnModifyActions = [
      QueryType[7],
      QueryType[6]
    ];

    const dataModifyActions = [
      QueryType[8],
      QueryType[9],
      QueryType[11],
    ];

    if (transactionActions.includes(this.meta.action)) {
      this.type = <ParseType>(<any>QueryType[this.meta.action]);

    } else if (transactionEndActions.includes(this.meta.action)) {
      this.type = ParseType.commit_transaction;

    } else if (
      this.meta.format === `table` &&
      this.meta.variant === QueryType[4]
    ) {
      this.type = ParseType.create_table;

    } else if (this.meta.action === QueryType[5]) {
      this.type = ParseType.rename_table;

    } else if (
      columnModifyActions.includes(this.meta.action)
    ) {
      this.type = ParseType.modify_table_columns;
    } else if (
      this.meta.format === `table` &&
      this.meta.variant === QueryType[6]
    ) {
      this.type = ParseType.drop_table;

    } else if (dataModifyActions.includes(this.meta.variant)) {
      this.type = ParseType.modify_data;

    } else if (this.meta.variant === QueryType[10]) {
      this.type = ParseType.select_data;

    } else {
      this.type = ParseType.other;
    }

    // Detect if the statement is a write with a read.
    this.isRead = (
      this.type === ParseType.create_table &&
      this.meta.definition?.[ZERO]?.type === `statement` &&
      this.meta.definition?.[ZERO]?.variant === QueryType[10]
    ) || (
      this.type === ParseType.modify_data &&
      this.meta.result?.type === `statement` &&
      this.meta.result?.variant === QueryType[10]
    );
  }

  private parseIsRead(): void {
    let iterator = new RecursiveIterator(
      this.meta,
      ONE, // Breath-first.
    );

    for (let { node } of iterator) {
      if (
        node.type === `statement` &&
        node.variant === QueryType[10]
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

    this.tables = []; this.columns = []; this.keys = [];
    if (tableActions.includes(this.type) || dataActions.includes(this.type)) {
      const { tables, columns, keys } = this.parseDataTables();
      this.tables = tables; this.columns = columns; this.keys = keys;
    }
  }

  private parseDataTables(): {
    tables: string[];
    columns: string[];
    keys: string[];
  } {
    /* #region  Parse table metadata. */
    const tables = new Set<string>();

    let iterator = new RecursiveIterator(
      this.meta,
      ONE, // Breath-first.
    );

    for (let { node } of iterator) {
      const conditions = new Set<boolean>([
        node.type === `identifier`,
        node.variant === `table` || node.format === `table`,
        !!node.name
      ]);

      if (conditions.has(false)) { continue; }

      tables.add(node.name);
    }
    /* #endregion */

    /* #region  Parse column metadata. */
    // Extract the columns metadata to an array.
    let definitions = [];
    if (!!this.meta.definition) {
      if (!!this.meta.definition.name) {
        definitions.push(this.meta.definition);
      } else if (!!this.meta.definition.length) {
        definitions = this.meta.definition;
      }
    }

    // Extract the columns and the key columns.
    const columns = []; const keys = [];
    for (let definition of definitions) {
      if (definition.type !== `definition`) { continue; }
      columns.push(definition.name);

      for (const constraint of definition.definition) {
        if (constraint.type !== `constraint`) { continue; }

        if (constraint.variant === `primary key`) {
          keys.push(definition.name);
          break;
        }
      }
    }
    /* #endregion */

    return {
      tables: Array.from(tables),
      columns,
      keys
    };
  }

  toObject(): QueryParseArg {
    return {
      query: this.query,
      params: this.params,

      type: this.type,
      isRead: this.isRead,
      tables: this.tables,
      columns: this.columns,
      keys: this.keys
    };
  }

  /**
   * Gets the string representation of the instance.
   * @returns string
   * @memberof Statement
   */
  toString(): string {
    return this.query;
  }
}

/* #region  Use schema to check the properties. */
const QueryParseInitArg = new ObjectModel({
  query: String,
  params: ArrayModel(Any)
});
/* #endregion */