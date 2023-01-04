import AwaitLock from 'await-lock';
import { DataSource } from 'typeorm';

import { CommitList, CommitListMem } from '../objects/commitList';
import { Result } from '../objects/result';
import { ResultList } from '../objects/resultList';
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

type QueueItem = {
  id: number;
  DB: ResultList;
  mem?: ResultList;

  isDB: boolean;
  isMem?: boolean;
};

export abstract class WorkerBase implements IWorker, IEngine {
  name: string;
  id: number;

  DB: DataSource;

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

  protected isWait: boolean;

  protected commitIDs: number[];
  protected saveID: number;
  protected queue: { [key: number]: QueueItem };

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

    /* #region  Declare the Broadcast Channel names. */
    this.inName = `${WORKER_CHANNEL}-${this.id}-${this.name}-in`;
    this.outName = `${WORKER_CHANNEL}-${this.id}-${this.name}-out`;

    this.queueInName = `${SAVER_CHANNEL}-${this.name}-in`;
    this.queueDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.queueMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;

    this.saverDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.saverMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;
    /* #endregion */

    this.isWait = false;

    this.saveID = ZERO;
    this.queue = {};
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

  protected abstract addWait(
    query: string,
    args: any[],
    commitListDB: CommitList
  ): Promise<ResultList[]>;

  protected abstract addFull(
    query: string,
    args: any[],
    commitListDB: CommitList,
    isLongInit?: boolean
  ): Promise<ResultList[]>;

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

  protected abstract getQueue(
    commitListDB: CommitList,
    isLong: boolean
  ): Promise<number[]>;

  protected abstract runDry(
    commitListDB: CommitList,
    commitListMem: CommitListMem,
    hasUpdate?: boolean
  ): Promise<[ResultList[], ResultList[], boolean]>

  async set(target: Target, results: ResultList): Promise<void> {
    let item: QueueItem = this.queue[results.id];

    // Create the queue item if necessary.
    if (item == undefined) {
      item = {
        id: results.id,
        DB: undefined,
        isDB: false,
        isMem: false
      };

      this.queue[results.id] = item;
    }

    // Update the queue results.
    switch (target) {
      case Target.DB: item.DB = results; break;
      case Target.mem: item.mem = results; break;
      default: break;
    }
  }

  async del(target: Target, commitID: number): Promise<void> {
    let item: QueueItem = this.queue[commitID];

    // #region   Create the queue item if necessary.
    if (item == undefined) {
      item = {
        id: commitID,
        DB: undefined,
        isDB: target === Target.DB,
        isMem: target === Target.mem
      };

      this.queue[commitID] = item;
    }

    // Update the queue completion flags.
    switch (target) {
      case Target.DB: item.isDB = true; break;
      case Target.mem: item.isMem = true; break;
      default: break;
    }

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