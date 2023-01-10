import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Commit } from '../../entity/commit';
import { CommitList } from '../../objects/commitList';
// import { Result } from '../../objects/result';
import { ResultList } from '../../objects/resultList';
import { ChanQueueMem } from '../../services/chanQueue';
import { WorkQueueMem } from '../../services/workQueue';
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
    super.chanQueue = new ChanQueueMem(this.id);
    super.workQueue = new WorkQueueMem();

    super.isMemory = true;

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

  protected async runDry(
    _query: string,
    _args: any[],
    _commitListDB: CommitList,
    _hasUpdate = false
  ): Promise<[ResultList[], ResultList[], boolean]> {

    // Parse the queries for the memory.
    // const commitListMem = new CommitListMem({
    //   script: query,
    //   params: args,
    //   tables: this.tablesMem,
    // });

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