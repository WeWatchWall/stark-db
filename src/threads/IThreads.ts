import { DataSource } from 'typeorm';
import { ResultList } from '../objects/resultList';
import { Target } from '../utils/constants';

export interface ICaller {
  worker: any;
}

export interface IThread {
  name: string;

  init(): Promise<void>;
  destroy(): Promise<void>;
}

export interface IEngine {
  DB: DataSource;
}

export interface IQueue extends IThread {
  name: string;
  target: Target;

  get(
    threadID: number,

    commitList: string[][],
    params: any[][][],

    isLong: boolean
  ): Promise<number[]>;
  add(results: ResultList): Promise<void>;
  set(results: ResultList): Promise<void>;
}

export interface ISaver extends IThread {
  target: Target;

  get(): Promise<number>;
  add(results: ResultList): Promise<void>;
  del(commit: number): Promise<void>;
}

export interface IWorker extends IThread {
  id: number;

  add(query: string, args: any[]): Promise<ResultList[]>;

  // From the queue.
  get(target: Target, threadID: number, commitIDs: number[]): Promise<void>;
  set(target: Target, results: ResultList): Promise<void>;

  // From the saver.
  del(target: Target, commitID: number): Promise<void>;
}