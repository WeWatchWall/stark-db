import { Results } from '../objects/results';
import { target } from '../utils/constants';
import { QCall } from '../utils/threadCalls';
import { ICaller, IQueue, ISaver } from './IThreads';

export class MemQCallerBase implements ICaller, IQueue {
  worker: any;

  async init(): Promise<void> {
    await this.worker.run({
      name: QCall.init,
      args: []
    });
  }

  async resize(size: number): Promise<void> {
    await this.worker.run({
      name: QCall.resize,
      args: [size]
    });
  }

  async get(): Promise<number> {
    return await this.worker.run({
      name: QCall.get,
      args: []
    });
  }

  async add(
    id: number,
    target: target,
    results: Results,
  ): Promise<void> {
    await this.worker.run({
      name: QCall.add,
      args: [
        id,
        target,
        results,
      ]
    });
  }

  async set(
    id: number,
    target: target,
    results: Results,
  ): Promise<void> {
    await this.worker.run({
      name: QCall.set,
      args: [
        id,
        target,
        results,
      ]
    });
  }

  async del(
    id: number,
    target: target,
  ): Promise<void> {
    await this.worker.run({
      name: QCall.del,
      args: [
        id,
        target,
      ]
    });
  }

  async destroy(): Promise<void> {
    if (!this.worker) { return; }

    await this.worker.run({
      name: QCall.destroy,
      args: []
    });

    await this.worker.worker.terminate();
    delete this.worker;
  }
}

export class MemSaverCallerBase implements ICaller, ISaver {
  worker: any;

  async init(): Promise<void> {
    await this.worker.run({
      name: QCall.init,
      args: []
    });
  }

  async add(
    id: number,
    target: target,
    results: Results
  ): Promise<void> {
    await this.worker.run({
      name: QCall.add,
      args: [
        id,
        target,
        results,
      ]
    });
  }

  async destroy(): Promise<void> {
    if (!this.worker) { return; }

    await this.worker.run({
      name: QCall.destroy,
      args: []
    });

    await this.worker.worker.terminate();
    delete this.worker;
  }
}