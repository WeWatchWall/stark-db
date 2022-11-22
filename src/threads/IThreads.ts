import { DataSource } from 'typeorm';
import { Results } from '../objects/results';
import { target } from '../utils/constants';

export interface ICaller {
  worker: any;
}

export interface IThread {
  init(): Promise<void>;
  destroy(): Promise<void>;
}

export interface IEngine {
  DB: DataSource;
}

export interface IQueue extends IThread {
  target: target;
 
  resize(size: number): Promise<void>;
  get(): Promise<number>;
  add(id: number, target: target, results: Results): Promise<void>;
  set(id: number, target: target, results: Results): Promise<void>;
  del(id: number, target: target): Promise<void>;
}

export interface ISaver extends IThread {
  target: target;

  add(id: number, target: target, results: Results): Promise<void>;
}

export interface IWorker extends IThread {
  run(query: string, args: any[]): Promise<Results>;
  pause(id: number, target: target): Promise<void>;
}