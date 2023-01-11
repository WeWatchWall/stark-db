import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Commit as CommitE } from '../../entity/commit';
import { Commit as CommitO } from '../../objects/commit';
import { CommitList } from '../../objects/commitList';
import { ParseType, QueryParse } from '../../objects/queryParse';
import { ResultList } from '../../objects/resultList';
import { WaitCommit } from '../../objects/waitCommit';
import { WorkData } from '../../objects/workData';
import { ChanQueueMem } from '../../services/chanQueue';
import { WorkQueueMem } from '../../services/workQueue';
import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';
import {
  COMMITS_TABLE,
  DB_DRIVER,
  ONE,
  RESULT_PREFIX,
  TABLES_TABLE,
  Target,
  ZERO
} from '../../utils/constants';
import { Thread } from '../../utils/thread';

export class Queue extends QueueBase {

  async init(): Promise<void> {
    // Set up the broadcast channels.
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage = async (message: any) => this.callMethod(message);

    // Connect to the saver broadcast channel.
    super.saverIn = new BroadcastChannel(this.saverInName);
    super.saverOut = new BroadcastChannel(this.saverOutName);
    this.saverOut.onmessage = async (message: any) => this.callMethod(message);

    // Connect to the database.
    super.DB = getDBConnection(this.name, this.target);
    await this.DB.initialize();

    // Skip the rest if the database is in Memory.
    if (this.target !== Target.DB) { return; }

    const commitRepo = this.DB.getRepository(CommitE);

    // Get and run all the transactions until they are caught up.
    const commits = await commitRepo
      .find({
        where: { isSaved: false },
        order: { id: 'ASC' }
      });

    let currentCommit = ZERO;

    // Save all the commits until the first one without a query.
    for (const commit of commits) {

      // This should only happen for the last long commit in the queue.
      // That commit should be re-tried later.
      // Also break if the commit is not the next one in the queue.
      if (currentCommit > ZERO && commit.id > currentCommit + ONE) { break; }

      currentCommit = commit.id;

      // Run the queries in a transaction if there are any.
      if (commit.queries != undefined && commit.queries.length > 0) {
        this.DB.query('BEGIN TRANSACTION;');
        for (let index = 0; index < commit.queries?.length || ZERO; index++) {
          const query = commit.queries[index];
          const params = commit.params[index];
          await this.DB.query(query, params);
        }
        this.DB.query('COMMIT TRANSACTION;');
      }

      // Mark the commit as saved.
      // Not atomic.
      commit.isSaved = true;
      await this.DB.manager.save(commit);
    }

    // Delete all the rows from the queue and reset its ID autoincrement.
    // Not atomic.
    await commitRepo.clear();
    await this.DB.query(
      `UPDATE SQLITE_SEQUENCE SET SEQ = 0 WHERE NAME = '${COMMITS_TABLE}';`
    );
  }
}

export class Saver extends SaverBase {
  async init(): Promise<void> {
    // Set up the Broadcast channels.
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage = async (message: any) => this.callMethod(message);

    // Connect to the DataSource, based conditionally on target.
    super.DB = getDBConnection(this.name, this.target);
    await this.DB.initialize();
  }
}

export class Worker extends WorkerBase {
  DBMem: DataSource;

  // Broadcast channels for the memory database.
  protected queueMemOut: any;
  protected saverMemOut: any;

  // TODO: Get the tables on every long query set invocation.
  protected tablesMem: Set<string>;

  protected waitCommitMem: WaitCommit;
  protected workDataMem: WorkData;

  async init(): Promise<void> {
    // TODO?: super.add = this.add.bind(this);

    super.chanQueue = new ChanQueueMem(this.id);
    super.workQueue = new WorkQueueMem();

    /* #region  Set up the Broadcast channels. */
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage = async (message: any) =>
      this.callMethod(message, Thread.Worker);

    super.queueDBOut = new BroadcastChannel(this.queueDBOutName);
    this.queueMemOut = new BroadcastChannel(this.queueMemOutName);
    this.queueDBOut.onmessage = async (message: any) =>
      this.callMethod(message, Thread.Queue, Target.DB);
    this.queueMemOut.onmessage = async (message: any) =>
      this.callMethod(message, Thread.Queue, Target.mem);

    super.saverDBOut = new BroadcastChannel(this.saverDBOutName);
    this.saverMemOut = new BroadcastChannel(this.saverMemOutName);
    this.saverDBOut.onmessage = async (message: any) =>
      this.callMethod(message, Thread.Saver, Target.DB);
    this.saverMemOut.onmessage = async (message: any) =>
      this.callMethod(message, Thread.Saver, Target.mem);
    /* #endregion */

    /* #region  Connect to the DataSources and helpers. */
    super.DB = getDBConnection(this.name, Target.DB);
    this.DBMem = getDBConnection(this.name, Target.mem);
    await this.DB.initialize();
    await this.DBMem.initialize();

    super.workDataDB = new WorkData({ DB: this.DB });
    this.workDataMem = new WorkData({ DB: this.DB });
    /* #endregion */

    // Get the memory tables from the database.
    const tablesMem = await this.DBMem.query(
      `SELECT name FROM ${TABLES_TABLE} WHERE isMemory = 1;`
    );
    this.tablesMem = new Set(tablesMem);
  }

  async add(query: string, args: any[]): Promise<ResultList[]> {
    // Parse the queries.
    const commitListDB = new CommitList({
      script: query,
      params: args,
    });

    if (this.isWait || commitListDB.isWait) {
      return await this.addWait(query, args, commitListDB);
    }

    return await this.addFull(query, args, commitListDB);
  }

  // TODO: Review this.
  async destroy(): Promise<void> {
    if (this.DB == undefined) { return; }

    // Close the Broadcast channels.
    this.queueMemOut.close();
    this.saverMemOut.close();

    // Close the DataSource.
    await this.DBMem.destroy();

    // Call the parent destroy method.
    await super.destroy();
  }

  protected async addFull(
    _query: string,
    _args: any[],
    _commitListDB: CommitList
  ): Promise<ResultList[]> {
    throw new Error('Method not implemented.');
  }

  protected async addWait(
    query: string,
    args: any[],
    commitListDB: CommitList
  ): Promise<ResultList[]> {
    await this.taskLock.acquireAsync();

    if (commitListDB.isLongMax) {
      await this.cancelWait();
      return WorkerBase.errors.limit;
    }

    if (!this.isWait) {
      super.waitCommitDB = new WaitCommit({ target: Target.DB });
      this.waitCommitMem = new WaitCommit({
        target: Target.mem,
        tables: Array.from(this.tablesMem)
      });

      this.isWait = true;
    }

    const commitID = this.commitIDs[ZERO];
    const commit = new CommitO({
      script: query,
      params: args,
    });

    const results: ResultList[] = [];

    for (let queryI = 0; queryI < commit.statements.length; queryI++) {
      const statement = commit.statements[queryI];

      /* #region  Runs faster if there is a memory-only select query. */
      if (
        statement.type === ParseType.select_data &&
        statement.tables.every(
          statementTable => this.tablesMem.has(statementTable)
        )
      ) {
        // Load the query from the memory database.
        this.waitCommitMem.load(statement.query, statement.params);

        // Get the memory results.
        const queryResults: ResultList = await this.workDataMem.loadRaw(
          commitID,
          Target.mem,
          true,
          statement,
          `${RESULT_PREFIX}${queryI}`
        );

        // Store the memory results.
        results.push(queryResults);

        continue;
      }
      /* #endregion */

      const runQueriesDB: QueryParse[] =
        this.waitCommitDB.load(statement.query, statement.params);

      if (runQueriesDB.length === ZERO) { continue; }

      // Run the query. Even if it implies a few queries, there is no result.
      let queryResults: ResultList;
      for (const queryDB of runQueriesDB) {
        queryResults = await this.workDataDB.loadRaw(
          commitID,
          Target.DB,
          true,
          queryDB,
          `${RESULT_PREFIX}${queryI}`
        );
      }
      // Store the DB results.
      results.push(queryResults);

      // Get the memory queries.
      const runQueriesMem: QueryParse[] =
        this.waitCommitMem.load(statement.query, statement.params);

      if (runQueriesMem.length === ZERO) { continue; }

      /* #region  Runs only the  memory-pertinent changes. */
      if (statement.type === ParseType.modify_data) {
        // Load the query from into memory wait commit.
        this.waitCommitMem.load(statement.query, statement.params);

        // Read the memory results.
        const queryResults: ResultList = await this.workDataDB.loadDiff(
          commitID,
          Target.mem,
          true
        );

        // Filter those results to only those tables in memory.
        queryResults.results = queryResults.results.filter(
          result => this.tablesMem.has(result.name)
        );

        // Store the memory results.
        await this.workDataMem.save(queryResults);

        continue;
      }
      /* #endregion */

      for (const queryMem of runQueriesMem) {
        await this.workDataDB.loadRaw(
          commitID,
          Target.mem,
          true,
          queryMem,
          `${RESULT_PREFIX}${queryI}`
        );
      }
    }

    // Check if the query is commited and finalize the wait.
    if (this.waitCommitDB.isEnd) {
      delete super.commitIDs;
      delete super.waitCommitDB;
      delete this.waitCommitMem;

      super.isWait = false;
    }

    this.taskLock.release();

    return results;
  }

  /**
   * Cancels a query.
   * @param [isLocal] Whether to cancel the query in the local worker.
   * @returns A promise that resolves when the query is cancelled.
   */
  protected async cancel(isLocal = false): Promise<void> {
    // Cancel the current run.
    for (const commitID of this.commitIDs) {
      await this.chanQueue.del(commitID);
    }
    delete super.commitIDs;

    if (isLocal) {
      await this.DB.query(`ROLLBACK TRANSACTION;`);
      await this.DBMem.query(`ROLLBACK TRANSACTION;`);

      this.taskLock.release();
    }
  }

  protected async cancelWait(): Promise<void> {
    if (!this.isWait) { return; }

    this.isWait = false;

    await this.cancel(true);
    return;
  }
}

function getDBConnection(name: string, target: Target): DataSource {
  switch (target) {
    case Target.DB:
      return new DataSource({
        type: DB_DRIVER,
        database: name,
        cache: true,
        synchronize: true, // TODO: should this be disabled?
        logging: false,
        entities: [CommitE],
        migrations: [],
        subscribers: [],
      });
    case Target.mem:
      return new DataSource({
        type: DB_DRIVER,
        database: `file:${name}?mode=memory`,
        flags:
          sqlite3.OPEN_URI |
          sqlite3.OPEN_SHAREDCACHE |
          sqlite3.OPEN_READWRITE |
          sqlite3.OPEN_CREATE,
        cache: true,
        synchronize: true, // TODO: should this be disabled?
        logging: false,
        entities: [CommitE],
        migrations: [],
        subscribers: [],
      });
    default:
      throw new Error(`Invalid target: ${target}`);
  }
};