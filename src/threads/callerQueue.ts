import { Results } from '../objects/results';
import { Target } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { ICaller, IQueue } from './IThreads';

export class QueueCallerBase implements ICaller, IQueue {
  target: Target;
  worker: any;

  constructor(target: Target) {
    this.target = target;
  }

  async init(): Promise<void> {
    await this.worker.run({
      name: PersistCall.init,
      args: [this.target]
    });
  }

  async resize(size: number): Promise<void> {
    await this.worker.run({
      name: PersistCall.resize,
      args: [size]
    });
  }

  async get(): Promise<number> {
    return await this.worker.run({
      name: PersistCall.get,
      args: []
    });
  }

  async add(
    id: number,
    target: Target,
    results: Results,
  ): Promise<void> {
    await this.worker.run({
      name: PersistCall.add,
      args: [
        id,
        target,
        results,
      ]
    });
  }

  async set(
    id: number,
    target: Target,
    results: Results,
  ): Promise<void> {
    await this.worker.run({
      name: PersistCall.set,
      args: [
        id,
        target,
        results,
      ]
    });
  }

  async del(
    id: number,
    target: Target,
  ): Promise<void> {
    await this.worker.run({
      name: PersistCall.del,
      args: [
        id,
        target,
      ]
    });
  }

  async destroy(): Promise<void> {
    if (!this.worker) { return; }

    await this.worker.run({
      name: PersistCall.destroy,
      args: []
    });

    await this.worker.worker.terminate();
    delete this.worker;
  }
}