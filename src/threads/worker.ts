import AwaitLock from 'await-lock';
import { DataSource } from 'typeorm';
import { Commit } from '../objects/commit';

import { CommitList } from '../objects/commitList';
import { QueryParse } from '../objects/queryParse';
import { QueryRaw } from '../objects/queryRaw';
import { Result } from '../objects/result';
import { ResultList } from '../objects/resultList';
import { WaitCommit } from '../objects/waitCommit';
import { WorkItem } from '../objects/workItem';
import { ChanQueue } from '../services/chanQueue';
import { WorkQueue } from '../services/workQueue';
import { ERRORS_TABLE, ONE, SAVER_CHANNEL, SELECT_RESULT, Target, WORKER_CHANNEL, ZERO } from '../utils/constants';
import { Thread } from '../utils/thread';
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

  queueDBOut: any;
  saverDBOut: any;

  protected inName: string;
  protected outName: string;

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
  protected waitCommit: WaitCommit;

  protected commitIDs: number[];
  protected saveID: number;

  protected chanQueue: ChanQueue;
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

    // Send the query to the queue.
    [this.saveID, this.commitIDs] =
      await this.chanQueue.get(commitListDB, isLong);

    // Get the result sets and check if the query is long.
    let
      [resultListDB, resultListMem, isLongLate]:
        [ResultList[], ResultList[], boolean] =
        await this.dryRun(query, args, commitListDB);

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

    await this.chanQueue.add(resultListDB, resultListMem);

    // Allow the next task to run.
    if (!isLongInit) { this.taskLock.release(); }

    return resultListDB;
  }

  protected async addWait(
    query: string,
    args: any[],
    commitListDB: CommitList,
  ): Promise<ResultList[]> {
    await this.taskLock.acquireAsync();

    if (commitListDB.isLongMax) {
      await this.cancelWait();
      return WorkerBase.errorResults;
    }

    if (!this.isWait) {
      this.waitCommit = new WaitCommit();
      this.isWait = true;
    }

    const commit = new Commit({
      script: query,
      params: args,
    });

    const results: ResultList[] = [];

    for (let queryI = 0; queryI < commit.statements.length; queryI++) {
      const result = new Result({
        name: `${SELECT_RESULT}${queryI}`,
        keys: [],
        rows: []
      });

      const resultList = new ResultList({
        id: this.commitIDs[ZERO],
        isLong: true,
        target: Target.DB,
        results: [result]
      });
      results.push(resultList);

      // TODO: Run the query.
      // const statement = commit.statements[queryI];
      // const runQueries: QueryParse[] =
      //   this.waitCommit.load(statement.query, statement.params);  
    }

    this.taskLock.release();
    
    return results;
  }

  /* #region  Cancellation logic. */

  /**
   * Cancels a query.
   * @param [isLocal] Whether to cancel the query in the local worker.
   * @returns A promise that resolves when the query is cancelled.
   */
  async cancel(isLocal = false): Promise<void> {
    if (!this.isRun) { return; }

    // Cancel the current run.
    for (const commitID of this.commitIDs) {
      await this.chanQueue.del(commitID);
    }

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

  protected abstract dryRun(
    _query: string,
    _args: any[],
    _commitListDB: CommitList,
    _hasUpdate?: boolean
  ): Promise<[ResultList[], ResultList[], boolean]>

  async runQuery(
    _DB: DataSource,
    statement?: QueryParse,
    isDiff?: boolean,
    resultList?: ResultList
  ): Promise<[ResultList, ResultList]> {
    if (!statement && !resultList) { return [undefined, undefined]; }

    if (!statement) {
      const rawQueries: QueryRaw[] = resultList.toUpdate();
      statement = new QueryParse({
        query: rawQueries.map(rawQuery => rawQuery.query).join(` `),
        params: rawQueries.map(rawQuery => rawQuery.params).flat(),
      });
    }
    
    // TODO: Parse the raw results.
    // const parserRaw = new ParserRaw({ DB, statement });
    // await parserRaw.load();
    // const rawResults = parserRaw.results;
    const rawResults = new ResultList();

    if (isDiff && !resultList) {
      // TODO: Get the results from the database.
      // const parserDiff = new ParserDiff({ DB });
      // await parserDiff.load();
      // const diffResults = parserDiff.results;
      // resultList = diffResults;
    }

    return [rawResults, resultList];
  }

  get(): Promise<void> {
    throw new Error('Method not implemented.');
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

    // TODO: Free up other properties from memory.
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
}