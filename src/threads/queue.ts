import AwaitLock from 'await-lock';
import { DataSource } from 'typeorm';

import { Results } from '../objects/results';
import { QUEUE_CHANNEL, Target } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { IQueue } from './IThreads';

export abstract class QueueBase implements IQueue {
  name: string;
  target: Target;

  DB?: DataSource;
  in: any;
  out: any;

  protected inName: string;
  protected outName: string;

  protected commit: number;
  protected commitLock: AwaitLock;

  constructor(name: string, target: Target, commit: number) {
    this.name = name;
    this.target = target;
    this.commit = commit;

    this.commitLock = new AwaitLock();
    this.inName = `${QUEUE_CHANNEL}-${this.target}-${this.name}-in`;
    this.outName = `${QUEUE_CHANNEL}-${this.target}-${this.name}-out`;
  }

  abstract init(): Promise<void>;

  async get(): Promise<number> {
    await this.commitLock.acquireAsync();
    
    this.commit++;
    const commit = this.commit;

    this.commitLock.release();

    return commit;
  }

  async add(_results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async set(results: Results): Promise<void> {
    this.out.postMessage({
      name: PersistCall.set,
      args: [results]
    });
  }

  async destroy(): Promise<void> {
    if (this.in == undefined) { return; }

    // Clean up the Broadcast Channel.
    this.in.close();
    this.out.close();
    delete this.in;
    delete this.out;

    if (this.DB == undefined) { return; }

    // Clean up the DataSource.
    await this.DB.destroy();
    delete this.DB;
  }
  
  protected async callMethod(event: any): Promise<any> {
    const { name, args }: {
      name: PersistCall, args: any[]
    } = event.data;

    switch (name) {
      case PersistCall.get:
        return await this.get();
      case PersistCall.add:
        return await this.add(Results.init(args[0]));
      default:
        break;
    }
  }
}