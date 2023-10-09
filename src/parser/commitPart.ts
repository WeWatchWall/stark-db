import { ObjectModel, SetModel } from 'objectmodel';
import { DataSource } from 'typeorm';

import { Commit, CommitArg } from './commit';
import { ParseType, QueryParse, READ_ONLY_Qs, TABLE_MODIFY_Qs } from './queryParse';
import { ONE, Target, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { QueryUtils } from '../utils/queries';

export const COMMIT_ANALYZERS: string[] = [
  'getReadOnly',
  'getTables',
];

export class CommitPartArg {
  DB?: DataSource;
  tables?: Set<string>;
  target?: Target;

  commit?: CommitArg;
  script?: string;
  params?: any[];

  isReadOnly?: any;
  isWait?: boolean;

  tablesRead?: string[];
  tablesWrite?: string[];
}

export class CommitPart {
  /* #region Public properties. */
  validator: LazyValidator;

  DB: DataSource;
  tables?: Set<string>;
  target: Target;

  commit: Commit;
  script: string;
  params: any[];

  isReadOnly?: any;
  isWait?: boolean;

  tablesRead?: string[];
  tablesWrite?: string[];
  /* #endregion */

  /**
   * Creates an instance of the class.
   * @param [init] @type {CommitPartArg} The initial value.
   */
  constructor(init?: CommitPartArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }

  private validate(): void {
    new CommitPartInit(this);
  }

  private ready(): void {
    this.commit = new Commit({ script: ``, params: [] });
    this.script = this.commit.script;
    this.params = this.commit.params;

    // Set the flags.
    this.isReadOnly = true;
    this.isWait = true;

    this.tablesRead = [];
    this.tablesWrite = [];

  }

  async add(
    script: string,
    params: any[]
  ): Promise<QueryParse[]> {
    const results: QueryParse[] = [];
    const newCommit = new Commit({ script, params });

    // Avoid running any statements after a commit.
    let newStatements = newCommit.statements.filter((query) => {
      if (!this.isWait) { return false; }

      if (
        query.type === ParseType.rollback_transaction ||
        query.type === ParseType.commit_transaction
      ) {
        this.isWait = false;
      }

      return true;
    });

    // Run the analysis.
    newStatements = this.set(newStatements);

    // Add the new queries to the results after the table modifications.
    for (const statement of newStatements) {
      const tableStatements = await this.addTablesModify(statement);
      results.push(...tableStatements);
    }

    return results;
  }

  get(): CommitPartArg {
    return {
      script: this.script,
      params: this.params,

      isReadOnly: this.isReadOnly,
      isWait: this.isWait,
    };
  }

  set(statements: QueryParse[] = []): QueryParse[] {
    let result: QueryParse[] = statements;

    for (const commitAnalyzer of COMMIT_ANALYZERS) {
      // @ts-ignore
      result = this[commitAnalyzer](result);
    }

    // Append the statements from the new commit to the current commit.
    const allStatements = this.commit.statements.concat(result);
    this.commit = new Commit({
      statements: allStatements,
    });
    this.script = this.commit.script;
    this.params = this.commit.params;

    return result;
  }

  /**
   * Gets the string representation of the instance.
   * @returns string 
   */
  toString(): string {
    return this.script;
  }

  /**
   * Adds tables modify statements and manages the memory tables.
   * Cannot be an analyzer due to the async nature.
   * @param statement @type {QueryParse} The statement to analyze.
   * @returns tables modify @type {QueryParse[]} The tables modify statements.
   */
  protected async addTablesModify(
    statement: QueryParse
  ): Promise<QueryParse[]> {
    const results: QueryParse[] = [statement];

    // Only run this for table modify statements on the DB.
    if (!TABLE_MODIFY_Qs.has(statement.type)) { return results; }

    /* #region Get the table queries. */
    const tableQueries = await QueryUtils.getTableModify(
      this.DB,
      statement
    );

    results.push(...tableQueries);
    /* #endregion */

    return results;
  }

  protected getReadOnly(statements: QueryParse[]): QueryParse[] {

    for (const statement of statements) {
      if (
        !this.isReadOnly ||
        !READ_ONLY_Qs.has(statement.type)
      ) {
        this.isReadOnly = false;
        break;
      }
    }

    return statements;
  }

  protected getTables(statements: QueryParse[]): QueryParse[] {
    for (const statement of statements) {
      this.tablesWrite.push(...statement.tablesWrite);
      this.tablesRead.push(...statement.tablesRead);
    }

    return statements;
  }
}

const CommitPartInit = new ObjectModel({
  DB: DataSource,
});