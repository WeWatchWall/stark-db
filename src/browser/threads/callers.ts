import { QueueCallerBase } from '../../threads/callerQueue';
import { SaverCallerBase } from '../../threads/callerSaver';
import { WorkerCallerBase } from '../../threads/callerWorker';
import { workerInit as queueWorkerInit } from './wrapperQueue';
import { workerInit as saverWorkerInit } from './wrapperSaver';
import { workerInit as workerWorkerInit } from './wrapperWorker';

export class WorkerCaller extends WorkerCallerBase {
  async init(): Promise<void> {
    this.worker = workerWorkerInit();
  }
}

export class QueueCaller extends QueueCallerBase {
  async init(): Promise<void> {
    this.worker = queueWorkerInit();
  }
}

export class SaverCaller extends SaverCallerBase {
  async init(): Promise<void> {
    this.worker = saverWorkerInit();
  }
}