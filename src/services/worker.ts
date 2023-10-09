import { ObjectModel } from 'objectmodel';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Commit } from '../parser/commit';
import { CommitList } from '../parser/commitList';
import { COMMIT_Qs, ParseType, QueryParse, TABLE_MODIFY_Qs } from '../parser/queryParse';
import { Result } from '../objects/result';
import { ResultList } from '../objects/resultList';
import { WorkData } from '../objects/workData';
import { CommitPart } from '../parser/commitPart';
import { ResetType, StarkWorkerArg, StarkWorkerBase } from '../services/workerBase';
import { ONE, RESULT_PREFIX, TABLES_TABLE, Target, ZERO } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { Method } from '../utils/method';
import { COMMIT_CANCEL, COMMIT_END, QueryUtils } from '../utils/queries';
import { Variable } from '../utils/variable';
import { Names } from '../utils/names';

export class StarkWorkerMemArg extends StarkWorkerArg {
  DBMem: DataSource;
}

export class StarkWorker extends StarkWorkerBase {
  DBMem: DataSource;

  protected commitPartMem: CommitPart;
  protected isTablesMemReset: boolean;
  protected tablesMem: Set<string>;
  protected tablesMemResetChannel: BroadcastChannel;
  protected workDataMem: WorkData;

  /**
   * Creates an instance of the class.
   * @param [init] @type {CommitPartArg} The initial value.
   */
  constructor(init?: StarkWorkerMemArg) {
    super(init);

    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, []),
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }

  protected validate(): void {
    new StarkWorkerInit(this);
  }

  protected ready(): void {
    super.ready();

    this.tablesMem = new Set<string>();
    this.workDataMem = new WorkData({ DB: this.DBMem });
  }

  async init(): Promise<void> {
    await this.workDataDB.init();
    await this.workDataMem.init();

    /* #region Set up the inter-thread mem tables reset mechanism. */
    this.isTablesMemReset = true;

    this.tablesMemResetChannel =
      new BroadcastChannel(Names.getWorkerMemTablesReset(this.name));

    this.tablesMemResetChannel.onmessage = (_msg) => {
      this.isTablesMemReset = true;
    };
    /* #endregion */
  }

  async add(query: string, args: any[]): Promise<ResultList[]> {
    // Run the tables reset if needed.
    await this.resetTablesMem();

    // Parse the queries.
    const commitListDB = new CommitList({
      DB: this.DB,
      isPart: this.isWait,
      script: query,
      params: args,

      tables: [],
      target: Target.DB
    });

    if (this.isWait || commitListDB.isWait) {
      return await this.addWait(commitListDB);
    } else if (commitListDB.isReadOnly) {
      return await this.addRead(commitListDB);
    } else {
      let fullResults: ResultList[];
      fullResults = await this.addAll(commitListDB);
      return fullResults;
    }
  }

  async addAll(
    commitListDB: CommitList
  ): Promise<ResultList[]> {
    // Initialize the state.
    const results: ResultList[] = [];
    await this.set();

    /* #region  Run all the transactions. */
    for (let commitI = 0; commitI < commitListDB.commitParts.length; commitI++) {
      /* #region Initialize the state. */
      const commitPart = commitListDB.commitParts[commitI];
      const commitID = ++this.commitID;

      super.commitPartDB = new CommitPart({
        DB: this.DB,
        target: Target.DB,
        tables: this.tablesMem
      });
      this.commitPartMem = new CommitPart({
        DB: this.DBMem,
        target: Target.mem,
        tables: new Set(this.tablesMem)
      });

      // Update the flags.
      this.commitPartDB.isMemory = commitListDB.isMemory;
      this.commitPartMem.isMemory = commitListDB.isMemory;
      /* #endregion */

      const { result: newResult } =
        await this.addFull(commitPart.commit, commitID);

      // Add the results to the list.
      results.push(newResult);

      // Run the commit transaction queries.
      if (!this.isError) { this.reset(ResetType.commit); }
      else { break; }
    }
    /* #endregion */

    // Clean up the worker state.
    await this.del();

    return results;
  }

  private async addFull(
    commit: Commit,
    commitID: number,
    isWait = false
  ): Promise<{
    isCommit: boolean;
    result: ResultList;
  }> {
    let resultEmpty = {
      id: commitID,
      target: Target.DB,

      resultsAdd: [] as any[],
      resultsDel: [] as any[],
      resultsSet: [] as any[],

      resultsGet: [] as any[],

      error: undefined as any,
      isCancel: false,
      isWait: false
    };
    let result: ResultList = new ResultList(resultEmpty);

    let isCommit = false;

    for (let sIndex = 0; sIndex < commit.statements.length; sIndex++) {
      const statement = commit.statements[sIndex];

      /* #region  Runs faster if there is a memory-only select query. */
      if (statement.type === ParseType.rollback_transaction) {
        result = new ResultList(resultEmpty);
        result.isCancel = true;
      } else if (isWait && statement.type === ParseType.begin_transaction) {
        continue;
      } else if (
        statement.type === ParseType.select_data &&
        statement.tablesRead.every(
          statementTable => this.tablesMem.has(statementTable)
        )
      ) {
        // Load the query from the memory database.
        await this.commitPartMem.add(statement.query, statement.params);

        // Get the memory results.
        let queryResults: ResultList;
        try {
          queryResults = await this.workDataMem.loadRaw(
            commitID,
            statement,
            `${RESULT_PREFIX}${sIndex}`
          );
        } catch (error) {
          result.error = error;
          this.isError = true;
          break;
        }

        // Store the memory results.
        result = ResultList.merge(result, queryResults);

        continue;
      }
      /* #endregion */

      const runQueriesDB: QueryParse[] = await this.commitPartDB.add(
        statement.query,
        statement.params
      );

      if (runQueriesDB.length === ZERO) { continue; }

      if (statement.type === ParseType.modify_data) {
        await this.reset(ResetType.dataTotal);

        // Enable the diff tables via the isWAL variable.
        const enableWAL: QueryParse =
          QueryUtils.getSetFlag(Variable.isDiff, true);
        await this.DB.query(enableWAL.query, enableWAL.params);
      }

      // Run the query. Even if it implies a few queries, there is no result.
      let queryResults: ResultList;
      try {
        for (const queryDB of runQueriesDB) {
          // Wait for the commit to be saved to memory.
          if (queryDB.type === ParseType.commit_transaction) {
            isCommit = true;
            break;
          }

          queryResults = await this.workDataDB.loadRaw(
            commitID,
            queryDB,
            `${RESULT_PREFIX}${sIndex}`
          );
        }
        // Store the DB results.
        result = ResultList.merge(result, queryResults);
      } catch (error) {
        result.error = error;
        this.isError = true;
        break;
      }

      if (statement.type === ParseType.modify_data) {
        const diffDBResults =
          await this.workDataDB.loadDiff(commitID, Target.DB);
        result = ResultList.merge(result, diffDBResults);
      }

      // Get the memory queries.
      const runQueriesMem: QueryParse[] = await this.commitPartMem.add(
        statement.query,
        statement.params
      );

      if (runQueriesMem.length === ZERO) { continue; }

      /* #region  Runs only the  memory-pertinent changes. */
      if (statement.type === ParseType.commit_transaction) {
        continue;
      } else if (statement.type === ParseType.modify_data) {
        // Load the query from into memory wait commit.
        await this.commitPartMem.add(statement.query, statement.params);

        // Read the memory results.
        const queryResults: ResultList = await this.workDataDB.loadDiff(
          commitID,
          Target.mem,
          Array.from(this.tablesMem)
        );

        // Filter those results to only those tables in memory.
        queryResults.resultsAdd = queryResults.resultsAdd.filter(
          result => this.tablesMem.has(result.name)
        );
        queryResults.resultsDel = queryResults.resultsDel.filter(
          result => this.tablesMem.has(result.name)
        );
        queryResults.resultsSet = queryResults.resultsSet.filter(
          result => this.tablesMem.has(result.name)
        );

        // Store the memory results.
        await this.workDataMem.save(queryResults);

        continue;
      } else if (TABLE_MODIFY_Qs.has(statement.type)) {
        // Send a message on the mem tables reset channel.
        this.tablesMemResetChannel.postMessage(true);
        this.isTablesMemReset = true;
      }
      /* #endregion */

      // All other queries run directly.
      try {
        for (const queryMem of runQueriesMem) {
          await this.workDataMem.loadRaw(
            commitID,
            queryMem,
            `${RESULT_PREFIX}${sIndex}`
          );
        }
      } catch (error) {
        result.error = error;
        this.isError = true;
        break;
      }
    }

    return { isCommit, result };
  }

  async addRead(
    commitListDB: CommitList
  ): Promise<ResultList[]> {
    const results: ResultList[] = [];

    for (const commitPart of commitListDB.commitParts) {
      // Create the commit results.
      const result = new ResultList({
        id: -ONE,

        resultsAdd: [],
        resultsDel: [],
        resultsSet: [],

        resultsGet: [],

        error: undefined,
        isCancel: false,
        isWait: false
      });
      results.push(result);

      // Run the queries.
      for (
        let queryI = 0;
        queryI < commitPart.commit.statements.length;
        queryI++
      ) {
        const statement: QueryParse = commitPart.commit.statements[queryI];

        // Skip any transaction management queries.
        if (statement.type === ParseType.rollback_transaction) {
          result.isCancel = true;
          break;
        }
        if (COMMIT_Qs.has(statement.type)) {
          continue;
        }

        // Check if the query is a memory only query.
        if (statement.tablesRead.every(table => this.tablesMem.has(table))) {
          let resultMem: any[];
          try {
            resultMem =
              await this.DBMem.query(statement.query, statement.params);
          } catch (error) {
            result.error = error;
            break;
          }

          result.resultsGet.push(new Result({
            name: `${RESULT_PREFIX}${queryI}`,
            autoKeys: [],
            keys: [],
            method: Method.get,
            rows: resultMem
          }));

          continue;
        }

        // Run the query on the file database.
        let resultDB: any[];
        try {
          resultDB =
            await this.DB.query(statement.query, statement.params);
        } catch (error) {
          result.error = error;
          break;
        }

        result.resultsGet.push(new Result({
          name: `${RESULT_PREFIX}${queryI}`,
          autoKeys: [],
          keys: [],
          method: Method.get,
          rows: resultDB
        }));
      }
    }

    await this.del();

    return results;
  }

  private async addWait(
    commitListDB: CommitList
  ): Promise<ResultList[]> {
    if (!this.isWait) { await this.set(); }

    // Initialize the wait commit if it hasn't been already.
    let isWaitLocal = this.isWait;
    if (!this.isWait) {
      super.commitPartDB = new CommitPart({
        DB: this.DB,
        target: Target.DB,
        tables: this.tablesMem
      });
      this.commitPartMem = new CommitPart({
        DB: this.DBMem,
        target: Target.mem,
        tables: new Set(this.tablesMem)
      });

      this.commitID++;
    }

    this.isWait = true;

    const { isCommit, result }: { isCommit: boolean; result: ResultList; } =
      await this.addFull(
        commitListDB.commitParts[ZERO].commit,
        this.commitID,
        isWaitLocal
      );

    // Check if the query is commited or rolled back and finalize the wait.
    if (!this.commitPartDB.isWait || this.isError) {
      // Check if the query is commited or rolled back.
      if (isCommit && !this.isError) { await this.reset(ResetType.commit); }

      await this.del();
    }

    result.isWait = this.isWait;
    return [result];
  }

  async del(): Promise<void> {
    switch (this.isError) {
      case false:
        this.reset(ResetType.state);
        this.reset(ResetType.lock);
        break;
      default:
        await this.reset(ResetType.cancel);
        this.reset(ResetType.state);
        this.reset(ResetType.lock);
        break;
    }
  }

  async destroy(): Promise<void> {
    await super.destroy();
    
    this.tablesMemResetChannel.close();
    delete this.tablesMemResetChannel;

    await this.DBMem.destroy();

    delete this.workDataMem;
  }

  protected async reset(resetType: ResetType): Promise<void> {
    await super.reset(resetType);

    switch (resetType) {
      // Rolls back the transaction.
      case ResetType.cancel: await this.DBMem.query(COMMIT_CANCEL); break;
      case ResetType.commit: await this.DBMem.query(COMMIT_END); break;
      default: break;
    }
  }

  protected async resetTablesMem(): Promise<void> {
    if (!this.isTablesMemReset) { return; }

    // Get the mem tables from the file database.
    const tablesMem: string[] =
      (await this.DB.query(
        `SELECT name FROM ${TABLES_TABLE} WHERE isMemory = ?;`,
        [ONE]
      ))
      .map((table: any) => table.name);

    this.tablesMem = new Set(tablesMem);

    // Reset the variable.
    this.isTablesMemReset = false;
  }
}

const StarkWorkerInit = new ObjectModel({
  DB: DataSource,
  DBMem: DataSource,
  id: Number,
  name: String
});