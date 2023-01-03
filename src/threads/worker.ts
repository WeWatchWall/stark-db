import { DataSource } from 'typeorm';

import { ResultList } from '../objects/resultList';
import { SAVER_CHANNEL, Target, WORKER_CHANNEL } from '../utils/constants';
import { ThreadCall } from '../utils/threadCall';
import { IEngine, IWorker } from './IThreads';

export abstract class WorkerBase implements IWorker, IEngine {
  name: string;
  id: number;

  DB: DataSource;

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

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;

    this.inName = `${WORKER_CHANNEL}-${this.id}-${this.name}-in`;
    this.outName = `${WORKER_CHANNEL}-${this.id}-${this.name}-out`;

    this.queueInName = `${SAVER_CHANNEL}-${this.name}-in`;
    this.queueDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.queueMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;

    this.saverDBOutName = `${SAVER_CHANNEL}-${Target.DB}-${this.name}-out`;
    this.saverMemOutName = `${SAVER_CHANNEL}-${Target.mem}-${this.name}-out`;
  }

  abstract init(): Promise<void>;

  async add(_query: string, _args: any[]): Promise<ResultList> {
    throw new Error("Method not implemented.");
  }
  
  async get(_target: Target, threadID: number, _commitIDs: number[]): Promise<void> {
    if (threadID !== this.id) { return; }

    throw new Error('Method not implemented.');
  }

  async set(_target: Target, _results: ResultList): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async del(_target: Target, _commitID: number): Promise<void> {
    throw new Error('Method not implemented.');
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
        return await this.get(target, args[0], args[0]);
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