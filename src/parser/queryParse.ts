import assert from 'assert';
import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import RecursiveIterator from 'recursive-iterator';
import sqliteParser from '@appland/sql-parser';

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
  delete_data = 9,

  other = 10,
}

export const COMMIT_Qs: Set<ParseType> = new Set([
  ParseType.begin_transaction,
  ParseType.commit_transaction,
  ParseType.rollback_transaction,
]);

export const DATA_Qs: Set<ParseType>  = new Set([
  ParseType.modify_data,
  ParseType.select_data,
  ParseType.delete_data,
]);

export const READ_ONLY_Qs: Set<ParseType> = new Set([
  ParseType.select_data,
  ParseType.begin_transaction,
  ParseType.commit_transaction,
  ParseType.rollback_transaction,
]);

export const TABLE_MODIFY_Qs = new Set<ParseType>([
  ParseType.create_table,
  ParseType.rename_table,
  ParseType.modify_table_columns,
  ParseType.drop_table,
]);

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
  tablesWrite?: string[];
  tablesRead?: string[];
  columns?: string[];
  autoKeys?: string[];
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
  tablesWrite: string[];
  tablesRead: string[];
  columns: string[];
  autoKeys: string[];
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
      this.validator.ready();
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
    // Set up the state.
    this.type = ParseType.other;
    this.isRead = false;
    this.tablesRead = []; this.tablesWrite = [];
    this.columns = [];
    this.autoKeys = [];
    this.keys = [];

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

    } else if (this.meta.variant === QueryType[11]) {
      this.type = ParseType.delete_data;

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
        node?.type === `statement` &&
        node?.variant === QueryType[10]
      ) {
        this.isRead = true;
        break;
      }
    }
  }

  private parseTables(): void {
    if (!TABLE_MODIFY_Qs.has(this.type) && !DATA_Qs.has(this.type)) {
      return;
    }

    const { columns, autoKeys, keys } = this.parseColumns();
    this.columns = columns; this.autoKeys = autoKeys; this.keys = keys;

    switch (this.type) {
      case ParseType.modify_data:
      case ParseType.delete_data:
        // Get the all the tables from the result.
        this.tablesWrite = this.parseDataTables(this.meta);

        // Get all the tables from the select part.
        const selectMeta = this.meta.result || this.meta.where;
        if (this.isRead && !!selectMeta) {
          this.tablesRead = this.parseDataTables(selectMeta);
        }
        break;
      case ParseType.create_table:
    
        // Get the all the tables from the result.
        this.tablesWrite = this.parseDataTables(this.meta);

        // Get all the tables from the select part.
        if (this.isRead && !!this.meta.definition) {
          this.tablesRead = this.parseDataTables(this.meta.definition);
        }
        break;

      case ParseType.rename_table:
        this.tablesWrite = this.parseDataTables(this.meta);
        this.tablesWrite = this.tablesWrite.reverse();
        break;

      case ParseType.modify_table_columns:
      case ParseType.drop_table:
        this.tablesWrite = this.parseDataTables(this.meta);
        break;

      default:
        this.tablesRead = this.parseDataTables(this.meta);
        break;
    }

    // Create a set of the Read tables.
    const tablesReadSet = new Set<string>(this.tablesRead);

    // Filter the tables to only include the tables that are not in the
    //   Read and Delete tables.
    this.tablesWrite = this.tablesWrite
      .filter(table => !tablesReadSet.has(table));
  }

  private parseColumns(): {
    columns: string[];
    autoKeys: string[];
    keys: string[];
  } {
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
    const columns = []; const autoKeys = [];  const keys = [];
    for (let definition of definitions) {
      if (definition.type !== `definition`) { continue; }

      if (definition.variant === `column`) {
        columns.push(definition.name);

        for (const constraint of definition.definition) {
          if (constraint.type !== `constraint`) { continue; }

          if (constraint.variant === `primary key`) {
            keys.push(definition.name);
            if(constraint.autoIncrement) { autoKeys.push(definition.name); }
            break;
          }
        }
      } else if (
        definition.variant === `constraint` &&
        (<any[]>definition.definition).findIndex(constraint =>
          constraint.type === `constraint` &&
          constraint.variant === `primary key`
        ) > -ONE
      ) {
        for (const column of definition.columns) {
          keys.push(column.name);
        }
      }
    }

    return {
      columns,
      autoKeys,
      keys
    };
  }

  private parseDataTables(rootNode: any): string[] {
    /* #region  Parse table metadata. */
    const tables = new Set<string>();

    let iterator = new RecursiveIterator(
      rootNode,
      ONE, // Breath-first.
    );

    for (let { node } of iterator) {
      const conditions = new Set<boolean>([
        node?.type === `identifier`,
        node?.variant === `table` || node?.format === `table`,
        !!node?.name
      ]);

      if (conditions.has(false)) { continue; }

      tables.add(node.name);
    }
    /* #endregion */


    return Array.from(tables);
  }

  toObject(): QueryParseArg {
    return {
      query: this.query,
      params: this.params,

      type: this.type,
      isRead: this.isRead,
      tablesWrite: this.tablesWrite,
      tablesRead: this.tablesRead,
      columns: this.columns,
      autoKeys: this.autoKeys,
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