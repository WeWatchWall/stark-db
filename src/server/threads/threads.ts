import FlatPromise from 'flat-promise';
import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Commit } from '../../entity/commit';
import { CommitList, CommitListMem } from '../../objects/commitList';
import { Result } from '../../objects/result';
import { ResultList } from '../../objects/resultList';
import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';
import {
  COMMITS_TABLE,
  DB_DRIVER,
  ERRORS_TABLE,
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

  queueMemOut: any;
  saverMemOut: any;

  tablesMem: string[];

  protected getPromiseMem: Promise<number[]>;

  async init(): Promise<void> {
    // Set up the Broadcast channels.
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

    // Connect to the DataSources.
    super.DB = getDBConnection(this.name, Target.DB);
    this.DBMem = getDBConnection(this.name, Target.mem);
    await this.DB.initialize();
    await this.DBMem.initialize();

    // Get the memory tables from the database.
    this.tablesMem = await this.DBMem.query(
      `SELECT name FROM ${TABLES_TABLE} WHERE isMemory = 1;`
    );
  }

  private async listenQueueDB(message: any): Promise<any> {
    return this.callMethod(message, Target.DB);
  }

  private async listenQueueMem(message: any): Promise<any> {
    return this.callMethod(message, Target.mem);
  }

  async add(
    query: string,
    args: any[],
    isLongInit = false
  ): Promise<ResultList[]> {
    if (!isLongInit) { await this.taskLock.acquireAsync(); }

    // Create the get promises.
    const getPromiseDB = new FlatPromise();
    const getPromiseMem = new FlatPromise();

    super.getPromiseDB = getPromiseDB.promise;
    this.getPromiseMem = getPromiseMem.promise;

    // Parse the queries.
    const commitListDB = new CommitList({
      script: query,
      params: args,
    });

    /* #region  Error checking for query length. */
    if (commitListDB.isLongMax) {
      if (!isLongInit) { this.taskLock.release(); }

      return [
        new ResultList({
          id: -ONE,
          isLong: true,
          target: Target.DB,
          results: [
            new Result({
              name: ERRORS_TABLE,
              keys: ['id'],
              rows: [{
                id: ZERO,
                name: 'RangeError',
                message: 'Query is too long.'
              }]
            })
          ]
        })
      ];
    }
    /* #endregion */

    // Check if the query is long.
    const isLong = isLongInit ||
      commitListDB.isLongUser ||
      commitListDB.isLongData ||
      commitListDB.isSchema;

    /* #region  Send the query to the queue. */
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
    /* #endregion */

    /* #region  Wait for the queue to respond with the commit IDs. */
    const [commitDBIds, commitMemIds]: number[][] = await Promise.all([
      this.getPromiseDB,
      this.getPromiseMem
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
        await this.getDryRun(commitListDB, commitListMem);

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
      const resultList = await this.add(query, args, true);
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

  getDryRun(
    _commitListDB: CommitList,
    _commitListMem: CommitListMem
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