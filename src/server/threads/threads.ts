import FlatPromise from 'flat-promise';
import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Commit } from '../../entity/commit';
import { CommitList, CommitListMem } from '../../objects/commitList';
// import { Result } from '../../objects/result';
import { ResultList } from '../../objects/resultList';
import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';
import {
  COMMITS_TABLE,
  DB_DRIVER,
  ONE,
  TABLES_TABLE,
  Target,
  ZERO
} from '../../utils/constants';
import { ThreadCall } from '../../utils/threadCall';

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

    const commitRepo = this.DB.getRepository(Commit);

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
  queueMemOut: any;
  saverMemOut: any;

  tablesMem: string[];

  async init(): Promise<void> {
    /* #region  Set up the Broadcast channels. */
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage = async (message: any) => this.callMethod(message);

    super.queueIn = new BroadcastChannel(this.queueInName);

    super.queueDBOut = new BroadcastChannel(this.queueDBOutName);
    this.queueMemOut = new BroadcastChannel(this.queueMemOutName);

    super.saverDBOut = new BroadcastChannel(this.saverDBOutName);
    this.saverMemOut = new BroadcastChannel(this.saverMemOutName);
    this.saverDBOut.onmessage =
      async (message: any) => this.callMethod(message, Target.DB);
    this.saverMemOut.onmessage =
      async (message: any) => this.callMethod(message, Target.mem);
    /* #endregion */

    /* #region  Connect to the DataSources. */
    super.DB = getDBConnection(this.name, Target.DB);
    this.DBMem = getDBConnection(this.name, Target.mem);
    await this.DB.initialize();
    await this.DBMem.initialize();
    /* #endregion */

    // Get the memory tables from the database.
    this.tablesMem = await this.DBMem.query(
      `SELECT name FROM ${TABLES_TABLE} WHERE isMemory = 1;`
    );
  }

  protected async addFull(
    query: string,
    args: any[],
    commitListDB: CommitList,
    isLongInit = false
  ): Promise<ResultList[]> {

    /* #region  Error checking for query length. */
    if (commitListDB.isLongMax) {
      if (!isLongInit) { this.taskLock.release(); }

      return WorkerBase.errorResults;
    }

    // Check if the query is long.
    const isLong = isLongInit ||
      commitListDB.isLongUser ||
      commitListDB.isLongData ||
      commitListDB.isSchema;
    /* #endregion */

    if (!isLongInit) {
      await this.taskLock.acquireAsync();
    }

    /* #region  Send the query to the queue. */
    // Create the get promises.
    super.commitIDs = await this.getQueue(commitListDB, isLong);
    /* #endregion */

    // Parse the queries for the memory.
    const commitListMem = new CommitListMem({
      script: query,
      params: args,
      tables: this.tablesMem,
    });

    // Get the result sets and check if the query is long.
    let
      [resultListDB, resultListMem, isLongLate]:
        [ResultList[], ResultList[], boolean] =
        await this.runDry(commitListDB, commitListMem);

    if (!isLong && isLongLate) {
      /* #region  Cancel the current run. */
      for (const resultList of resultListDB) {
        this.queueIn.postMessage({
          method: ThreadCall.add,
          args: [
            new ResultList({
              id: resultList.id,
              isLong: false,
              target: Target.DB,
              results: []
            }).toObject()
          ]
        });

        this.queueIn.postMessage({
          method: ThreadCall.add,
          args: [
            new ResultList({
              id: resultList.id,
              isLong: false,
              target: Target.mem,
              results: []
            }).toObject()
          ]
        });
      }
      /* #endregion */

      /* #region  Re-run the query and return the results. */
      const resultList = await this.addFull(query, args, commitListDB, true);
      this.taskLock.release();

      return resultList;
      /* #endregion */
    }

    // TODO: Wait until the WAL is fully written.

    // TODO: Check if the resultLists intersect with the WAL.

    // TODO: Rerun the query if the resultLists intersect with the WAL.

    /* #region   Add the resultLists to the queues. */
    for (const resultList of resultListDB) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [resultList]
      });
    }
    for (const resultList of resultListMem) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [resultList]
      });
    }
    /* #endregion */

    // Allow the next task to run.
    if (!isLongInit) { this.taskLock.release(); }

    return resultListDB;
  }

  protected async addWait(
    _query: string,
    _args: any[],
    _commitListDB: CommitList,
  ): Promise<ResultList[]> {
    throw new Error('Method not implemented.');
  }

  protected async getQueue(
    commitListDB: CommitList,
    isLong: boolean
  ): Promise<number[]> {
    super.getPromiseDB = new FlatPromise();
    super.getPromiseMem = new FlatPromise();

    this.queueDBOut.onmessage = this.listenQueueDB;
    this.queueMemOut.onmessage = this.listenQueueMem;

    this.queueIn.postMessage({
      method: ThreadCall.get,
      args: [
        this.id,

        commitListDB.commits.map(
          commit => commit.statements.map(statement => statement.query)
        ),
        commitListDB.commits.map(
          commit => commit.statements.map(statement => statement.params)
        ),

        isLong
      ]
    });

    // Wait for the queue to respond with the commit IDs.
    const [commitDBIds, commitMemIds]: number[][] = await Promise.all([
      this.getPromiseDB.promise,
      this.getPromiseMem.promise
    ]);

    // Sanity check between DB and memory. Also cleanup the noisy channels.
    try {
      if (
        commitDBIds[ZERO] != commitMemIds[ZERO] ||
        commitDBIds.length !== commitMemIds.length
      ) {
        throw new Error("Commit IDs don't match.");
      }
    } finally {
      this.queueDBOut.removeEventListener('message', this.listenQueueDB);
      this.queueMemOut.removeEventListener('message', this.listenQueueMem);
    }

    return commitDBIds;
  }

  protected async runDry(
    _commitListDB: CommitList,
    _commitListMem: CommitListMem,
    _hasUpdate = false
  ): Promise<[ResultList[], ResultList[], boolean]> {
    throw new Error('Method not implemented.');
  }

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
        entities: [Commit],
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
        entities: [Commit],
        migrations: [],
        subscribers: [],
      });
    default:
      throw new Error(`Invalid target: ${target}`);
  }
};