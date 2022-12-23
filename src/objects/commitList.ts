import { LinkList } from 'js-sdsl';
import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import { NEWLINE, ONE, ZERO } from '../utils/constants';
import { LazyLoader } from '../utils/lazyLoader';
import { LazyValidator } from '../utils/lazyValidator';
import { Commit, CommitArg } from './commit';
import { ParseType, Statement } from './statement';

export class CommitListArg {
  script?: string;
  params?: any[];
  commits?: CommitArg[] | Commit[];

  isLong?: boolean;
  isWait?: boolean;
}

export class CommitList {
  loader: LazyLoader;
  validator: LazyValidator;

  script: string;
  params: any[];
  commits: Commit[];

  isLong: boolean;
  isWait: boolean;

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
    try {
      this.validator.valid();
    } catch (error) {
      this.isSave = true;
    }

    if (this.isSave) { return; }

    this.validator.ready();
  }

  private loadValidate(): void {
    new CommitListLoad(this);
  }

  private loadReady(): void {
    // Set the flags.
    this.isLong = false;
    this.isWait = false;

    // Load the commit arg as a commit list.
    const commitArg = new Commit({
      script: this.script,
      params: this.params,
    });

    // Initialize the argument to the analyzation stack.
    let commitList: Statement[] | LinkList<Statement>[]
      = commitArg.statements;

    for (const commitAnalyzer of CommitList.commitAnalyzers) {
      commitList = this[commitAnalyzer](commitList);
    }

    // Convert the commit list to a commit array.
    this.commits = (<LinkList<Statement>[]>commitList)
      .map((commit) => new Commit({
        statements: Array.from(commit)
      }));
  }

  private static commitAnalyzers = [
    'splitCommits',
  ];

  splitCommits(statements: Statement[]): LinkList<Statement>[] {
    const result: LinkList<Statement>[] = [];

    let currentCommit: LinkList<Statement>;

    /* #region  Split up the statements into commits based on the */
    //   begin transaction statement.
    for (const statement of statements) {
      if (
        currentCommit == undefined ||
        statement.type === ParseType.begin_transaction
      ) {
        currentCommit = new LinkList<Statement>();
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
      result[ZERO].pushFront(new Statement({
        statement: `BEGIN TRANSACTION;`,
        params: []
      }));
    }
    /* #endregion */

    /* #region  Check the first and only statement ends with a */
    //   commit transaction statement.
    if (!this.isWait && result.length > ZERO) {
      // Ensure every last statement is a commit transaction statement.
      for (const commit of result) {
        if (commit.back().type === ParseType.commit_transaction) { continue; }
        
        commit.pushBack(new Statement({
          statement: `COMMIT TRANSACTION;`,
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
    this.script = this.commits.map((commit) => commit.script).join(NEWLINE);
    this.params = this.commits.map((commit) => commit.params).flat();
  }
  /* #endregion */

  toObject(): CommitListArg {
    return {
      script: this.script,
      params: this.params,
      commits: this.commits.map((commit) => commit.toObject()),

      isLong: this.isLong,
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
}

/* #region  Use schema to check the properties. */
const CommitListLoad = new ObjectModel({
  script: String,
  params: ArrayModel(Any),
  commits: undefined,
});

const CommitListSave = new ObjectModel({
  script: [String],
  params: [ArrayModel(Any)],
  commits: ArrayModel(Commit),
});
/* #endregion */