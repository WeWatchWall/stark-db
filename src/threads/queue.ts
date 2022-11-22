import { Results } from '../objects/results';
import { target } from '../utils/constants';
import { IQueue } from './IThreads';

export abstract class QueueBase implements IQueue {
  target: target;

  constructor(target: target) {
    this.target = target;
  }

  abstract init(): Promise<void>;

  async resize(_size: number): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async get(): Promise<number> {
    throw new Error("Method not implemented.");
  }

  async add(_id: number, _target: target, _results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async set(_id: number, _target: target, _results: Results): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async del(_id: number, _target: target): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async destroy(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}