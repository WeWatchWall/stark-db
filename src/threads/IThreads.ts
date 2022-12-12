import { DataSource } from 'typeorm';
import { Results } from '../objects/results';
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
  
  DB?: DataSource;
  in: any;
  out: any;

  get(): Promise<number>;
  add(results: Results): Promise<void>;
  set(results: Results): Promise<void>;
}

export interface ISaver extends IThread {
  target: Target;

  get(): Promise<number>;
  add(results: Results): Promise<void>;
  del(commit: number): Promise<void>;
}

export interface IWorker extends IThread {
  id: number;

  run(query: string, args: any[]): Promise<Results>;
  pause(id: number, target: Target): Promise<void>;
}