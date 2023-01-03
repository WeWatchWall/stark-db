import { DataSource } from 'typeorm';

import { ResultList } from '../objects/resultList';
import { IEngine, IWorker } from './IThreads';

export abstract class WorkerBase implements IWorker, IEngine {
  name: string;
  id: number;

  DB: DataSource;

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;
  }

  abstract init(): Promise<void>;

  async run(_query: string, _args: any[]): Promise<ResultList> {
    throw new Error("Method not implemented.");
  }

  async destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}