import AwaitLock from 'await-lock';
import { DataSource } from 'typeorm';

import { CommitList } from '../objects/commitList';
import { Result } from '../objects/result';
import { ResultList } from '../objects/resultList';
import { WorkItem } from '../objects/workItem';
import { WorkQueue } from '../services/workQueue';
import {
  ERRORS_TABLE,
  ONE,
  SAVER_CHANNEL,
  Target,
  WORKER_CHANNEL,
  ZERO
} from '../utils/constants';
import { ThreadCall } from '../utils/threadCall';
import { IEngine, IWorker } from './IThreads';

export abstract class WorkerBase implements IWorker, IEngine {
  name: string;
  id: number;

  DB: DataSource;

  // Whether this is a memory worker.
  isMemory: boolean;

  /* #region  Declare the Broadcast Channels. */
  in: any;
  out: any;

  queueIn: any;
  queueDBOut: any;

  saverDBOut: any;

  protected inName: string;
  protected outName: string;

  protected queueInName: string;
  protected queueDBOutName: string;
  protected queueMemOutName: string;

  protected saverDBOutName: string;
  protected saverMemOutName: string;
  /* #endregion */

  protected taskLock: AwaitLock;

  protected getPromiseDB: any;
  protected getPromiseMem: any;

  protected isRun: boolean;
  protected isWait: boolean;

  protected commitIDs: number[];
  protected saveID: number;
  protected workQueue: WorkQueue;

  static errorResults = [
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

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;

    this.isMemory = false;

    /* #region  Declare the Broadcast Channel names. */
    this.inName = `${WORKER_CHANNEL}-${this.id}-${this.name}-in`;
    this.outName = `${WORKER_CHANNEL}-${this.id}-${this.name}-out`;

    this.queueInName = `${SAVER_CHANNEL}-${this.name}-in`;
    this.queueDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.queueMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;

    this.saverDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.saverMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;
    /* #endregion */

    this.isRun = false;
    this.isWait = false;

    this.saveID = ZERO;
    this.workQueue = new WorkQueue();
  }

  abstract init(): Promise<void>;

  async add(
    query: string,
    args: any[]
  ): Promise<ResultList[]> {
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

  protected async addFull(
    query: string,
    args: any[],
    commitListDB: CommitList,
    isLongInit = false
  ): Promise<ResultList[]> {

    /* #region  Error checking for query length. */
    if (commitListDB.isLongMax) {
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
    this.commitIDs = await this.queueGet(commitListDB, isLong);
    /* #endregion */

    // Get the result sets and check if the query is long.
    let
      [resultListDB, resultListMem, isLongLate]:
        [ResultList[], ResultList[], boolean] =
        await this.runDry(query, args, commitListDB);

    if (!isLong && isLongLate) {
      await this.cancel();

      /* #region  Re-run the query and return the results. */
      const resultList = await this.addFull(query, args, commitListDB, true);
      this.taskLock.release();

      return resultList;
      /* #endregion */
    }

    // TODO: Wait until the WAL is fully written.

    // TODO: Check if the resultLists intersect with the WAL.

    // TODO: Rerun the query if the resultLists intersect with the WAL.

    await this.queueAdd(resultListDB, resultListMem);

    // Allow the next task to run.
    if (!isLongInit) { this.taskLock.release(); }

    return resultListDB;
  }

  protected async addWait(
    _query: string,
    _args: any[],
    commitListDB: CommitList,
  ): Promise<ResultList[]> {
    await this.taskLock.acquireAsync();

    if (commitListDB.isLongMax) {
      await this.cancelWait();
      return WorkerBase.errorResults;
    }

    if (!this.isWait) {
      this.isWait = true;
    }

    throw new Error("Not implemented.");
  }

  /* #region  Cancellation logic. */

  /**
   * Cancels a query.
   * @param [isLocal] Whether to cancel the query in the local worker.
   * @returns A promise that resolves when the query is cancelled.
   */
  async cancel(isLocal = false): Promise<void> {
    if (!this.isRun) { return; }

    /* #region  Cancel the current run. */
    for (const commitID of this.commitIDs) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [
          new ResultList({
            id: commitID,
            isLong: false,
            target: Target.DB,
            results: []
          }).toObject()
        ]
      });

      if (this.isMemory) {
        this.queueIn.postMessage({
          method: ThreadCall.add,
          args: [
            new ResultList({
              id: commitID,
              isLong: false,
              target: Target.mem,
              results: []
            }).toObject()
          ]
        });
      }
    }
    /* #endregion */

    if (isLocal) {
      this.commitIDs = undefined;
      this.isRun = false;

      await this.DB.query(`ROLLBACK TRANSACTION;`);
      this.taskLock.release();
    }
  }

  /**
   * Cancels the waiting query.
   * @returns A promise that resolves when the waiting query is cancelled.
   */
  async cancelWait(): Promise<void> {
    if (!this.isWait) { return; }

    this.isWait = false;

    await this.cancel(true);
    return;
  }
  /* #endregion */

  /* #region  Dynamic queue listeners. */
  protected async listenQueueDB(message: any): Promise<any> {
    return this.callMethod(message, Target.DB);
  }
  protected async listenQueueMem(message: any): Promise<any> {
    return this.callMethod(message, Target.mem);
  }
  /* #endregion */

  async get(
    target: Target,
    threadID: number,
    saveID: number,
    commitIDs: number[]
  ): Promise<void> {
    if (threadID !== this.id) { return; }

    if (target === Target.DB) { this.saveID = saveID; }

    switch (target) {
      case Target.DB: this.getPromiseDB.resolve(commitIDs); break;
      case Target.mem: this.getPromiseMem.resolve(commitIDs); break;
      default: break;
    }
  }

  /* #region  Queue helper functions. */
  protected abstract queueGet(
    commitListDB: CommitList,
    isLong: boolean
  ): Promise<number[]>;

  protected async queueAdd(
    resultListDB: ResultList[],
    resultListMem?: ResultList[]
  ): Promise<void> {
    for (const resultList of resultListDB) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [resultList]
      });
    }

    if (!this.isMemory) { return; }

    for (const resultList of resultListMem) {
      this.queueIn.postMessage({
        method: ThreadCall.add,
        args: [resultList]
      });
    }
  }
  /* #endregion */

  protected abstract runDry(
    _query: string,
    _args: any[],
    _commitListDB: CommitList,
    _hasUpdate?: boolean
  ): Promise<[ResultList[], ResultList[], boolean]>

  async set(target: Target, results: ResultList): Promise<void> {
    /* #region  Update the work queue. */
    const item: WorkItem = new WorkItem({
      id: results.id,
      DB: undefined,
      isDB: false,
      isMem: false
    });

    // Update the queue results.
    switch (target) {
      case Target.DB: item.DB = results; break;
      case Target.mem: item.mem = results; break;
      default: break;
    }

    this.workQueue.set(item);
    /* #endregion */
  }

  async del(target: Target, commitID: number): Promise<void> {
    /* #region  Update the work queue. */
    const item: WorkItem = new WorkItem({
      id: commitID,
      DB: undefined,
      isDB: target === Target.DB,
      isMem: target === Target.mem
    });

    // Update the queue completion flags.
    switch (target) {
      case Target.DB: item.isDB = true; break;
      case Target.mem: item.isMem = true; break;
      default: break;
    }

    this.workQueue.set(item);
    /* #endregion */

    // TODO: Trigger & debounce queue re-evaluation.
    // TODO: Trim the queue if there is no transaction and it gets too long.
  }

  async destroy(): Promise<void> {
    if (this.DB == undefined) { return; }

    // Clean up the Broadcast Channels.
    this.in.close();
    this.out.close();
    this.queueIn.close();
    this.queueDBOut.close();
    this.saverDBOut.close();

    await this.DB.destroy();
    delete this.DB;
  }

  protected async callMethod(event: any, target = Target.DB): Promise<any> {
    const { name, args }: {
      name: ThreadCall, args: any[]
    } = event.data;

    switch (name) {
      case ThreadCall.add:
        return await this.add(args[0], args[1]);

      // From the queue.
      case ThreadCall.get:
        return await this.get(target, args[0], args[1], args[2]);
      case ThreadCall.set:
        return await this.set(target, ResultList.init(args[0]));

      // From the saver.
      case ThreadCall.del:
        return await this.del(target, args[0]);

      case ThreadCall.destroy:
        return await this.destroy();
      default:
        break;
    }
  }
}