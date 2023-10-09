import { LinkList } from 'js-sdsl';
import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import { DataSource } from 'typeorm';

import { CommitPart, CommitPartArg, COMMIT_ANALYZERS } from './commitPart';
import { NEWLINE, ONE, Target, ZERO } from '../utils/constants';
import { LazyLoader } from '../utils/lazyLoader';
import { LazyValidator } from '../utils/lazyValidator';
import { COMMIT_END, COMMIT_START } from '../utils/queries';
import { Commit } from './commit';
import { ParseType, QueryParse } from './queryParse';

export class CommitListArg {
  DB?: DataSource;
  script?: string;
  params?: any[];
  tables?: string[];
  target?: Target;

  commitParts?: CommitPartArg[] | CommitPart[];

  isReadOnly?: any;
  isPart?: boolean;
  isWait?: boolean;

  tablesRead?: string[];
  tablesWrite?: string[];
}

export class CommitList {
  loader: LazyLoader;
  validator: LazyValidator;

  DB: DataSource;
  script: string;
  params: any[];
  tables: string[];
  target: Target;

  commitParts: CommitPart[];

  isReadOnly: any;
  isPart: boolean;
  isWait: boolean;

  tablesRead: string[];
  tablesWrite: string[];

  private isSave: boolean;

  /**
   * Creates an instance of the class.
   * @param [init] @type {CommitListArg} The initial values.
   */
  constructor(init: CommitListArg) {
    // Hook up the loader.
    this.loader = new LazyLoader(
      () => this.load.apply(this, []),
      () => this.save.apply(this, [])
    );

    // Apply the arguments and load the script.
    if (init != undefined) {
      Object.assign(this, init);
      this.script = this.script?.trim();

      this.loader.save();
    }
  }

  /* #region  Loads from the script string. */
  load(): void {
    this.validator = new LazyValidator(
      () => this.loadValidate.apply(this, []),
      () => this.loadReady.apply(this, [])
    );

    this.isSave = false;
    this.validator.valid();

    if (this.isSave) { return; }

    this.validator.ready();
  }

  protected loadValidate(): void {
    CommitListLoad.test(this, (errors: any[]) => {
      if (errors?.length > ZERO) {
        this.isSave = true;
      }
    });
  }

  protected loadReady(): void {
    // Set the flags.
    this.isReadOnly = true;
    this.isPart = this.isPart || false;
    this.isWait = false;

    this.tablesRead = [];
    this.tablesWrite = [];

    // Load the commit arg as a commit list.
    const commitArg = new Commit({
      script: this.script,
      params: this.params,
    });

    // Initialize the argument to the analyzation stack.
    let commitList: LinkList<QueryParse>[]
      = this.splitCommits(commitArg.statements);

    // Convert the commitList to a @type {CommitPart} array.
    this.commitParts = commitList
      .map((commit: LinkList<QueryParse>) => {
        const commitPart = new CommitPart({
          DB: this.DB,
          tables: new Set(this.tables),
          target: this.target
        });

        const statements: QueryParse[] = Array.from(commit);
        commitPart.set(statements);

        return commitPart;
      });
    
    this.runAnalysis();
  }

  runAnalysis(): void {
    for (const commitAnalyzer of COMMIT_ANALYZERS) {
      // @ts-ignore
      this[commitAnalyzer]();
    }
  }

  splitCommits(statements: QueryParse[]): LinkList<QueryParse>[] {
    const result: LinkList<QueryParse>[] = [];

    let currentCommit: LinkList<QueryParse>;

    /* #region  Split up the statements into commits based on the */
    //   begin transaction statement.
    for (const statement of statements) {
      if (
        currentCommit == undefined ||
        statement.type === ParseType.begin_transaction
      ) {
        currentCommit = new LinkList<QueryParse>();
        result.push(currentCommit);
      }

      currentCommit.pushBack(statement);
    }
    /* #endregion */

    // Check if the user specifies a partial query.
    this.isWait = result.length === ONE &&
      result[ZERO].front().type === ParseType.begin_transaction &&
      result[ZERO].back().type !== ParseType.commit_transaction;

    /* #region  Check the first statement begins with a */
    //   begin transaction statement.
    if (
      result.length > ZERO &&
      result[ZERO].front().type !== ParseType.begin_transaction
    ) {
      result[ZERO].pushFront(new QueryParse({
        query: COMMIT_START,
        params: []
      }));
    }
    /* #endregion */

    /* #region  Check the first and only statement ends with a */
    //   commit transaction statement.
    if (!this.isPart && !this.isWait && result.length > ZERO) {
      // Ensure every last statement is a commit transaction statement.
      for (const commit of result) {
        if (commit.back().type === ParseType.commit_transaction) { continue; }

        commit.pushBack(new QueryParse({
          query: COMMIT_END,
          params: []
        }));
      }
    }
    /* #endregion */

    return result;
  }

  /* #region  Saves to the script string. */
  save(): void {
    this.validator = new LazyValidator(
      () => this.saveValidate.apply(this, []),
      () => this.saveReady.apply(this, [])
    );
    this.validator.ready();
  }

  private saveValidate(): void {
    new CommitListSave(this);
  }

  private saveReady(): void {
    this.script = this.commitParts.map((commit) => commit.script).join(NEWLINE);
    this.params = this.commitParts.map((commit) => commit.params).flat();

    this.runAnalysis();

    // Set the target from the first @type {CommitPart}.
    this.target = this.target || this.commitParts?.[ZERO]?.target;
    this.target = this.target || Target.DB;
  }
  /* #endregion */

  toObject(): CommitListArg {
    return {
      script: this.script,
      params: this.params,

      commitParts: this
        .commitParts
        .map((commitPart) => commitPart.commit.toObject()),

      isReadOnly: this.isReadOnly,
      isWait: this.isWait,
    };
  }

  /**
   * Gets the string representation of the instance.
   * @returns string 
   */
  toString(): string {
    return this.script;
  }

  /**
   * Check if any of the @type {CommitPart} instances have write queries.
   */
  protected getReadOnly(): void {
    this.isReadOnly = this.commitParts.every((commit) => commit.isReadOnly);
  }

  /**
   * Create the tablesRead and tablesWrite properties.
   */
  protected getTables(): void {
    const tablesRead = this.commitParts
      .map((commit) => commit.tablesRead)
      .flat();
    const tablesReadSet = new Set(tablesRead);
    this.tablesRead = [...tablesReadSet];

    const tablesWrite = this.commitParts
      .map((commit) => commit.tablesWrite)
      .flat();
    const tablesWriteSet = new Set(tablesWrite);
    this.tablesWrite = [...tablesWriteSet];
  }
  /* #endregion */

}

/* #region  Use schema to check the properties. */
const CommitListLoad = new ObjectModel({
  DB: DataSource,
  isPart: [Boolean],
  script: String,
  params: ArrayModel(Any),
  tables: ArrayModel(String),
  target: Target.DB,

  commitParts: undefined,
});

const CommitListSave = new ObjectModel({
  DB: [DataSource],
  script: [String],
  params: [ArrayModel(Any)],
  tables: [ArrayModel(String)],
  target: [Target.DB, undefined],

  commitParts: ArrayModel(CommitPart),
});
/* #endregion */