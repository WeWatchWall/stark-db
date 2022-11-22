import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';

export class Worker extends WorkerBase {
  async init(): Promise<void> {
    // TODO:
    // Init DataSource: this.target === targets.DB ? this.DB = ...
    // Setup Broadcast Channel(s)
    throw new Error("Method not implemented.");
  }
}

export class Queue extends QueueBase {
  async init(): Promise<void> {
    // TODO:
    // Setup Broadcast Channel(s)
    throw new Error("Method not implemented.");
  }
}

export class Saver extends SaverBase {
  async init(): Promise<void> {
    // TODO:
    // Init DataSource: this.target === targets.DB ? this.DB = ...
    // Setup Broadcast Channel(s)
    throw new Error("Method not implemented.");
  }
}