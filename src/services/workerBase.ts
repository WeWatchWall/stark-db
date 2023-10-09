import AwaitLock from 'await-lock';
import { DataSource } from 'typeorm';

import { ResultList } from '../objects/resultList';
import { WorkData } from '../objects/workData';
import { ONE } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { COMMIT_CANCEL, COMMIT_END } from '../utils/queries';
import { CommitPart } from '../parser/commitPart';

export class StarkWorkerArg {
  DB: DataSource;
  id: number;
  name: string;
}

export abstract class StarkWorkerBase {
  DB: DataSource;
  id: number;
  name: string;

  protected commitID: number;
  protected commitPartDB: CommitPart;
  protected isError: boolean;
  protected isWait: boolean;
  protected validator: LazyValidator;
  protected workDataDB: WorkData;

  private taskLock: AwaitLock;

  /**
   * Creates an instance of the class.
   * @param [init] @type {CommitPartArg} The initial value.
   */
  constructor(init?: StarkWorkerArg) {
    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
    }
  }

  protected ready(): void {
    this.commitID = -ONE;
    this.isError = false;
    this.isWait = false;

    this.taskLock = new AwaitLock();
    // Needs to be initialized.
    this.workDataDB = new WorkData({DB: this.DB});
  }
  
  abstract init(): Promise<void>;

  abstract add(query: string, args: any[]): Promise<ResultList[]>;

  // abstract get(): void;

  async set(): Promise<void> {
    await this.taskLock.acquireAsync();

    // Other profiling code here.
  }

  abstract del(): Promise<void>;

  protected async reset(resetType: ResetType): Promise<void> {
    switch (resetType) {
      // Rolls back the DB transaction.
      case ResetType.cancel: await this.DB.query(COMMIT_CANCEL); break;
      // Commits the DB transaction.
      case ResetType.commit: await this.DB.query(COMMIT_END); break;

      // Clears the diff tables.
      case ResetType.data: await this.workDataDB.tare(true); break;
      // Clears the diff and total tables.
      case ResetType.dataTotal: await this.workDataDB.tare(true); break;

      // Clears the queue lock.
      case ResetType.lock:
        if (this.taskLock.acquired) { this.taskLock.release(); }
        break;
      // Clears the state of the class.
      case ResetType.state: this.isError = false; this.isWait = false; break;

      default:
        break;
    }
  }

  async destroy(): Promise<void> {
    await this.DB.destroy();

    delete this.workDataDB;
  }
}

export enum ResetType {
  cancel = 'cancel',
  commit = 'commit',

  data = 'data',
  dataTotal = 'dataTotal',

  lock = 'lock',
  state = 'state',
}

// const StarkWorkerInit = new ObjectModel({
//   DB: DataSource,
//   id: Number,
//   name: String
// });