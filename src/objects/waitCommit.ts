import { ObjectModel } from 'objectmodel';

import { ONE, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Commit } from './commit';
import { CommitList } from './commitList';
import { ParseType, QueryParse } from './queryParse';
import { QueryRaw } from './queryRaw';

class WaitCommitArg {
  script?: string;
  params?: any[];
}

export class WaitCommit {
  validator: LazyValidator;
  
  script: string;
  params: any[];

  commit: Commit;
  commitList: CommitList;
  isEnd: boolean;

  private currentQuery: QueryRaw;

  /**
   * Creates an instance of the class.
   * @param [init] @type {WaitCommitArg} The initial value.
   */
  constructor(init?: WaitCommitArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  private validate(): void {
    new WaitCommitInit(this);
  }

  private ready(): void {
    this.load(this.script, this.params);
  }

  load(script: string, params: any[]): QueryParse[] {
    let currentIndex = ZERO;

    if (!this.commit) {
      this.commit = new Commit({ script, params });
      this.commitList = new CommitList({ script, params });
    } else {
      const newCommit = new Commit({ script, params });

      // Avoid running any statements after a commit.
      let isEnd = false || this.isEnd;
      const newQueries = newCommit.statements.filter((query) => {
        if (isEnd) { return false; }

        if (
          query.type === ParseType.rollback_transaction ||
          query.type === ParseType.commit_transaction
        ) {
          isEnd = true;
        }

        return true;
      });

      // Append the statements from the new commit to the current commit.
      this.commit.statements.push(...newQueries);
      this.commit = new Commit({
        statements: this.commit.statements,
      });

      // Re-create the commit list using the new commit.
      this.commitList = new CommitList({
        script: this.commit.script,
        params: this.commit.params
      });

      // Search for the current query in the new commit list.
      currentIndex = this
        .commitList
        .commits[ZERO]
        .search(this.currentQuery.query, this.currentQuery.params);
      // Ignore negative results, as this is the result of setting variables.
      currentIndex = Math.max(currentIndex, ZERO);
    }

    this.setIsEnd();

    try {
      const results: QueryParse[] = [];
      const queryCount = this.commitList.commits[ZERO].statements.length;

      // Return the statements from the current query to the end of the commit.
      for (let commitI = currentIndex; commitI < queryCount; commitI++) {
        const currentQuery = this.commitList.commits[ZERO].statements[commitI];
        results.push(currentQuery);
      }

      return results;
    } finally {
      const commitLength = this.commitList.commits.length;

      this.currentQuery = new QueryRaw({
        query: this.commit.statements[commitLength - ONE].query,
        params: this.commit.statements[commitLength - ONE].params
      });
    }
  }

  save(): void {
    this.commitList.save();

    this.script = this.commitList.script;
    this.params = this.commitList.params;
  }

  private setIsEnd(): void {
    this.isEnd =
      this.commitList.commits.length > ONE ||

      this.commitList[ZERO].statements[this.commit.statements.length - ONE]
      .type === ParseType.commit_transaction;
  }
}

const WaitCommitInit = new ObjectModel({
  script: String,
  params: Array,
});