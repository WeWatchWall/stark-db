import AwaitLock from 'await-lock';
import { DataSource } from 'typeorm';

import { Result } from '../objects/result';
import { ResultList } from '../objects/resultList';
import { WaitCommit } from '../objects/waitCommit';
import { WorkData } from '../objects/workData';
import { WorkItem } from '../objects/workItem';
import { ChanQueue } from '../services/chanQueue';
import { WorkQueue } from '../services/workQueue';
import {
  ERRORS_TABLE,
  ONE,
  SAVER_CHANNEL,
  Target,
  WORKER_CHANNEL,
  ZERO
} from '../utils/constants';
import { Thread } from '../utils/thread';
import { ThreadCall } from '../utils/threadCall';
import { IEngine, IWorker } from './IThreads';

export abstract class WorkerBase implements IWorker, IEngine {
  name: string;
  id: number;

  DB: DataSource;

  /* #region  Declare the Broadcast Channels. */
  in: any;
  out: any;

  queueDBOut: any;
  saverDBOut: any;

  protected inName: string;
  protected outName: string;

  protected queueDBOutName: string;
  protected queueMemOutName: string;

  protected saverDBOutName: string;
  protected saverMemOutName: string;
  /* #endregion */

  protected chanQueue: ChanQueue;
  protected commitIDs: number[];
  protected isWait: boolean;
  protected saveID: number;
  protected taskLock: AwaitLock;
  protected waitCommit: WaitCommit;
  protected workDataDB: WorkData;
  protected workQueue: WorkQueue;

  protected static errors = {
    limit: [new ResultList({
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
    })]
  };

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;

    /* #region  Declare the Broadcast Channel names. */
    this.inName = `${WORKER_CHANNEL}-${this.id}-${this.name}-in`;
    this.outName = `${WORKER_CHANNEL}-${this.id}-${this.name}-out`;

    this.queueDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.queueMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;

    this.saverDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.saverMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;
    /* #endregion */

    this.saveID = ZERO;
  }

  
  abstract init(): Promise<void>;

  abstract add(query: string, args: any[]): Promise<ResultList[]>;

  async get(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async set(target: Target, results: ResultList): Promise<void> {
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

  // TODO: Review this.
  async destroy(): Promise<void> {
    if (this.DB == undefined) { return; }

    // Clean up the Broadcast Channels.
    this.in.close();
    this.out.close();
    this.queueDBOut.close();
    this.saverDBOut.close();

    delete this.in;
    delete this.out;
    delete this.queueDBOut;
    delete this.saverDBOut;

    await this.DB.destroy();

    delete this.DB;
  }

  protected async callMethod(
    event: any,
    thread: Thread,
    target = Target.DB
  ): Promise<any> {
    const { name, args }: {
      name: ThreadCall, args: any[]
    } = event.data;

    switch (thread) {
      case Thread.Worker:
        switch (name) {
          case ThreadCall.add: return await this.add(args[0], args[1]);
          case ThreadCall.get: return await this.get();
          default: break;
        }
        break;

      case Thread.Queue:
        if (name === ThreadCall.set) {
          return await this.set(target, ResultList.init(args[0]));
        }
        break;

      case Thread.Saver:
        if (name === ThreadCall.del) {
          return await this.del(target, args[0]);
        }
        break;

      default:
        break;
    }
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
    this.commitIDs = undefined;

    if (isLocal) {
      await this.DB.query(`ROLLBACK TRANSACTION;`);
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