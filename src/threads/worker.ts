import { DataSource } from 'typeorm';

import { Results } from '../objects/results';
import { Target } from '../utils/constants';
import { IEngine, IWorker } from './IThreads';

export abstract class WorkerBase implements IWorker, IEngine {
  id: number;
  DB: DataSource;

  constructor(id: number) {
    this.id = id;
  }

  abstract init(): Promise<void>;

  async run(_query: string, _args: any[]): Promise<Results> {
    throw new Error("Method not implemented.");
  }

  async pause(_id: number, _target: Target): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}