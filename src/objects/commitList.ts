import { LinkList } from 'js-sdsl';
import { Any, ArrayModel, ObjectModel } from 'objectmodel';
import RecursiveIterator from 'recursive-iterator';
import sqliteParser from 'sqlite-parser';

import {
  DIFFS_TABLE_PREFIX,
  NEWLINE,
  ONE,
  PARAMS_MAX,
  QUERY_MAX,
  STATEMENT_DELIMITER,
  STATEMENT_PLACEHOLDER,
  TABLES_TABLE,
  TRIGGER_ADD,
  TRIGGER_PREFIX,
  TRIGGER_SET,
  VALUE_DELIMITER,
  VARS_TABLE,
  ZERO,
} from '../utils/constants';
import { LazyLoader } from '../utils/lazyLoader';
import { LazyValidator } from '../utils/lazyValidator';
import { Variable } from '../utils/variable';
import { Commit, CommitArg } from './commit';
import { ParseType, QueryParse } from './queryParse';

export class CommitListArg {
  script?: string;
  params?: any[];
  commits?: CommitArg[] | Commit[];

  isLongUser?: boolean;
  isLongData?: boolean;
  isLongMax?: boolean;
  isSchema?: boolean;
  isMemory?: boolean;
  isWait?: boolean;
}

export class CommitList {
  loader: LazyLoader;
  validator: LazyValidator;

  script: string;
  params: any[];
  commits: Commit[];

  isLongUser: boolean;
  isLongData: boolean;
  isLongMax: boolean;
  isSchema: boolean;
  isMemory: boolean;
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

  protected loadValidate(): void {
    new CommitListLoad(this);
  }

  protected loadReady(): void {
    // Set the flags.
    this.isLongUser = false;
    this.isLongData = false;
    this.isLongMax = false;
    this.isSchema = false;
    this.isMemory = true;
    this.isWait = false;

    // Load the commit arg as a commit list.
    const commitArg = new Commit({
      script: this.script,
      params: this.params,
    });

    // Initialize the argument to the analyzation stack.
    let commitList: QueryParse[] | LinkList<QueryParse>[]
      = commitArg.statements;

    for (const commitAnalyzer of this.commitAnalyzers) {
      commitList = this[commitAnalyzer](commitList);
    }

    // Convert the commit list to a commit array.
    this.commits = (<LinkList<QueryParse>[]>commitList)
      .map((commit) => new Commit({
        statements: Array.from(commit)
      }));
  }

  protected commitAnalyzers = [
    'splitCommits',
    'getLongQueries',
    'countMax',
    'setFlags',
    'writeTables'
  ];

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
        query: `BEGIN TRANSACTION;`,
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

        commit.pushBack(new QueryParse({
          query: `COMMIT TRANSACTION;`,
          params: []
        }));
      }
    }
    /* #endregion */

    return result;
  }

  countMax(commits: LinkList<QueryParse>[]): LinkList<QueryParse>[] {
    // Counters.    
    let queryCount = ZERO;
    let paramCount = ZERO;

    for (const commit of commits) {
      if (this.isLongMax) { break; }

      for (const statement of commit) {
        queryCount += statement.query.length;
        paramCount += statement.params.length;
      }

      if (
        queryCount > QUERY_MAX ||
        paramCount > PARAMS_MAX
      ) {
        this.isLongMax = true;
      }
    }

    return commits;
  }

  getLongQueries(commits: LinkList<QueryParse>[]): LinkList<QueryParse>[] {
    for (const commit of commits) {
      if (this.isLongData) { break; }

      for (const statement of commit) {
        if (
          (statement.type === ParseType.modify_data && statement.isRead) ||
          statement.type === ParseType.delete_data
        ) {
          this.isLongData = true;
          break;
        }
      }
    }

    return commits;
  }

  setFlags(commits: LinkList<QueryParse>[]): LinkList<QueryParse>[] {
    // Remove the statements that update the isWAL flag.
    for (let cIndex = ZERO; cIndex < commits.length; cIndex++) {
      let commitList = commits[cIndex];
      let commit = Array.from(commitList);
      const indexes = new Set<number>();

      for (let sIndex = ZERO; sIndex < commit.length; sIndex++) {
        const statement: QueryParse = commit[sIndex];

        // Skip all statements that are not update variable statements.
        if (
          statement.type !== ParseType.modify_data ||
          !statement.tables.includes(VARS_TABLE)
        ) { continue; }

        // Check the parameters for the variables.
        if (statement.params.includes(Variable.isWAL)) {
          this.isLongUser = true;
          indexes.add(sIndex);
        }
        if (statement.params.includes(Variable.isMemory)) {
          this.isMemory = false;
          indexes.add(sIndex);
        }

        const statementMeta = sqliteParser(statement.query);

        /* #region  Search for the isWAL variable. */
        let isFound = false;
        let iterator = new RecursiveIterator(
          statementMeta,
          ONE, // Breath-first.
        );
        for (let { node } of iterator) {
          if (node?.name !== Variable.isWAL) { continue; }

          isFound = true;
          break;
        }
        if (isFound) {
          indexes.add(sIndex);
          this.isLongUser = true;
        }
        /* #endregion */

        /* #region  Search for the isMemory variable. */
        isFound = false;
        iterator = new RecursiveIterator(
          statementMeta,
          ONE, // Breath-first.
        );
        for (let { node } of iterator) {
          if (node?.name !== Variable.isMemory) { continue; }

          isFound = true;
          break;
        }
        if (isFound) {
          indexes.add(sIndex);
          this.isMemory = false;
        }
        /* #endregion */
      }

      // Remove the flag statements & update the commit list.
      if (indexes.size > ZERO) {
        commit = commit.filter((_, index) => !indexes.has(index));
        commitList = new LinkList<QueryParse>(commit);
        commits[cIndex] = commitList;
      }

      // Add the isWAL statement to the beginning of the statements list.
      // The value is set in the worker. First, the value is true to
      //   extract the data. Then, the value is false to commit the data.
      commitList.insert(ONE, new QueryParse({
        query:
          `UPDATE ${VARS_TABLE} SET value = ? WHERE id = "${Variable.isWAL}";`,
        params: [ZERO],
      }));

      // Check if the first commit is waiting.
      if (this.isWait) { break; }

      // Add the isWAL statement to the end of the statements list.
      commitList.insert(commitList.length - ONE, new QueryParse({
        query:
          `UPDATE ${VARS_TABLE} SET value = ? WHERE id IN ("${Variable.isWAL}", "${Variable.isMemory}");`,
        params: [ONE],
      }));
    }

    return commits;
  }

  writeTables(commits: LinkList<QueryParse>[]): LinkList<QueryParse>[] {
    const tableTypes = new Set<ParseType>([
      ParseType.create_table,
      ParseType.rename_table,
      ParseType.modify_table_columns,
      ParseType.drop_table,
    ]);

    for (const commit of commits) {
      const statements = Array.from(commit);
      const results: QueryParse[][] = [];

      /* #region  Render the table statements. */
      for (let sIndex = 0; sIndex < statements.length; sIndex++) {
        const statement = statements[sIndex];

        // Skip all statements that are not table statements.
        if (!tableTypes.has(statement.type)) { continue; }

        this.isSchema = true;
        results[sIndex] = CommitList.getTableQueries(statement, this.isMemory);
      }
      /* #endregion */

      /* #region  Write the table statements to the statements list. */
      for (let sIndex = 0; sIndex < results.length; sIndex++) {
        const result = results[sIndex];

        if (!result) { continue; }

        // Insert the result statements in reverse order.
        for (let rIndex = result.length - ONE; rIndex >= ZERO; rIndex--) {
          commit.insert(sIndex + ONE, result[rIndex]);
        }
      }
      /* #endregion */
    }

    return commits;
  }

  static getTableQueries(statement: QueryParse, isMemory: boolean): QueryParse[] {
    const results: QueryParse[] = [];

    switch (statement.type) {
      case ParseType.create_table:
        /* #region  Create the diffs table. */
        const diffTableName = `${DIFFS_TABLE_PREFIX}${statement.tables[ZERO]}`;
        const selectRegex = /AS[\s]+SELECT[\s\S]*/gi;
        const query = statement
          .query
          .replace(selectRegex, STATEMENT_DELIMITER)
          .replace(statement.tables[ZERO], diffTableName);

        results.push(new QueryParse({
          query: query,
          params: [],
        }));
        /* #endregion */

        /* #region  Create the triggers. */
        const columns = statement
          .columns
          .map(column => `NEW.${column}`)
          .join(`${VALUE_DELIMITER} `);

        const triggerAddName =
          `${TRIGGER_PREFIX}${TRIGGER_ADD}${statement.tables[ZERO]}`;
        const triggerAddQuery = this.getTrigger(
          `insert`,
          triggerAddName,
          statement.tables[ZERO],
          diffTableName,
          columns
        );

        results.push(new QueryParse({
          query: `DROP TRIGGER IF EXISTS ${triggerAddName};`,
          params: []
        }));
        results.push(new QueryParse({
          query: triggerAddQuery,
          params: [],
        }));

        const triggerSetName =
          `${TRIGGER_PREFIX}${TRIGGER_SET}${statement.tables[ZERO]}`;
        const triggerSetQuery = this.getTrigger(
          `update`,
          triggerSetName,
          statement.tables[ZERO],
          diffTableName,
          columns
        );

        results.push(new QueryParse({
          query: `DROP TRIGGER IF EXISTS ${triggerSetName};`,
          params: []
        }));
        results.push(new QueryParse({
          query: triggerSetQuery,
          params: [],
        }));

        results.push(new QueryParse({
          query: `REPLACE INTO ${TABLES_TABLE} VALUES (?, ?, ?, ?);`,
          params: [
            statement.tables[ZERO],
            JSON.stringify(statement.keys),
            isMemory ? ONE : ZERO,
            ZERO
          ]
        }));
        /* #endregion */
        break;
      case ParseType.rename_table:
      case ParseType.modify_table_columns:
        results.push(new QueryParse({
          query: `DROP TRIGGER IF EXISTS ${triggerAddName};`,
          params: []
        }));
        results.push(new QueryParse({
          query: `DROP TRIGGER IF EXISTS ${triggerSetName};`,
          params: []
        }));

        // Update the table name if it is renamed.
        if (statement.type === ParseType.rename_table) {
          results.push(new QueryParse({
            query: `UPDATE ${TABLES_TABLE} SET name = ? WHERE name = ?;`,
            params: statement.tables
          }));
        }

        const oldTableName = statement.type === ParseType.rename_table ?
          statement.tables[ONE] :
          statement.tables[ZERO];
        results.push(new QueryParse({
          query: `SELECT sql FROM sqlite_master WHERE name = ?;`,
          params: [oldTableName]
        }));

        // Expects this same method to be called again using the result
        //   of the previous statement.
        results.push(new QueryParse({
          query: STATEMENT_PLACEHOLDER,
          params: []
        }));
        break;
      case ParseType.drop_table:
        results.push(new QueryParse({
          query: `DELETE FROM ${TABLES_TABLE} WHERE name = ?;`,
          params: statement.tables
        }));
        break;
      default:
        break;
    }

    return results;
  }

  private static getTrigger(
    op: `insert` | `update`,
    name: string,
    table: string,
    diffName: string,
    columns: string
  ) {
    return `CREATE TRIGGER
IF NOT EXISTS ${name}
  AFTER ${op}
  ON ${table}
  WHEN (SELECT value FROM ${VARS_TABLE} WHERE id = "${Variable.isWAL}") IN (1)
BEGIN
  INSERT INTO ${diffName}
  VALUES (${columns});
END;`;
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

      isLongUser: this.isLongUser,
      isLongData: this.isLongData,
      isLongMax: this.isLongMax,
      isSchema: this.isSchema,
      isMemory: this.isMemory,
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

/* #region  Memory commit list. */
export class CommitListMemArg extends CommitListArg {
  tables?: string[];
  isAllMemory?: boolean;
}

export class CommitListMem extends CommitList {
  tables: string[];
  
  isAllMemory: boolean;

  constructor(arg: CommitListMemArg) {
    super(arg);
  }

  protected loadValidate(): void {
    new CommitListMemLoad(this);
  }

  protected loadReady(): void {
    super.commitAnalyzers = [
      'splitCommits',
      'getLongQueries',
      'countMax',
      'setFlags',
      'delMemTables',
      'delMemData',
      'writeTables'
    ];

    this.isAllMemory = true;

    super.loadReady();
  }

  delMemTables(commits: LinkList<QueryParse>[]): LinkList<QueryParse>[] {
    if (this.isMemory) { return commits; }

    // Remove other statements if the memory flag is set to false.
    for (let cIndex = ZERO; cIndex < commits.length; cIndex++) {
      let commitList = commits[cIndex];
      let commit = Array.from(commitList);
      const indexes = new Set<number>();

      for (let sIndex = ZERO; sIndex < commit.length; sIndex++) {
        const statement = commit[sIndex];

        if (
          statement.type === ParseType.create_table ||
          statement.type === ParseType.other ||

          (
            !this.tables.includes(statement.tables[ONE]) &&
            statement.type === ParseType.rename_table
          ) ||

          !this.tables.includes(statement.tables[ZERO]) &&
          (
            statement.type === ParseType.modify_table_columns ||
            statement.type === ParseType.drop_table
          )
        ) {
          this.isAllMemory = false;
          indexes.add(sIndex);
        }
      }

      // Remove the flag statements & update the commit list.
      if (indexes.size > ZERO) {
        commit = commit.filter((_, index) => !indexes.has(index));
        commitList = new LinkList<QueryParse>(commit);
        commits[cIndex] = commitList;
      }
    }

    return commits;
  }
  
  delMemData(commits: LinkList<QueryParse>[]): LinkList<QueryParse>[] {
    // Remove other statements if the memory flag is set to false.
    for (let cIndex = ZERO; cIndex < commits.length; cIndex++) {
      let commitList = commits[cIndex];
      let commit = Array.from(commitList);
      const indexes = new Set<number>();

      for (let sIndex = ZERO; sIndex < commit.length; sIndex++) {
        const statement = commit[sIndex];

        // Remove select statements that include non-memory tables. Those run
        //   only on the DB.
        if (statement.type === ParseType.select_data) {
          const isMem = statement
            .tables
            .every((table) => this.tables.includes(table));

          if (!isMem) {
            this.isAllMemory = false;
            indexes.add(sIndex);
          }
        }

        // Remove modification statements that don't include any memory tables.
        //   Those run only on the DB.
        else if (statement.type === ParseType.modify_data) {
          const tables = statement.tables;
          const isMem = tables
            .some((table) => this.tables.includes(table));
          const isMemAll = tables
            .every((table) => this.tables.includes(table));
          
          if (!isMemAll) {
            this.isAllMemory = false;
          }
          if (!isMem) {
            indexes.add(sIndex);
          }
        }
      }

      // Remove the flag statements & update the commit list.
      if (indexes.size > ZERO) {
        commit = commit.filter((_, index) => !indexes.has(index));
        commitList = new LinkList<QueryParse>(commit);
        commits[cIndex] = commitList;
      }
    }

    return commits;
  }
}

const CommitListMemLoad = new ObjectModel({
  script: String,
  params: ArrayModel(Any),
  commits: undefined,

  tables: ArrayModel(String),
});
/* #endregion */