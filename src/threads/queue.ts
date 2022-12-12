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
    throw new Error("Method not implemented.");
  }

  async add(_results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async set(_results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async destroy(): Promise<void> {
    throw new Error("Method not implemented.");
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