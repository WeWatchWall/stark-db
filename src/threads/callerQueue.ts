import { ResultList } from '../objects/resultList';
import { Target } from '../utils/constants';
import { ThreadCall } from '../utils/threadCalls';
import { ICaller, IQueue } from './IThreads';

export class QueueCallerBase implements ICaller, IQueue {
  name: string;
  target: Target;

  worker: any;

  constructor(name: string, target: Target) {
    this.name = name;
    this.target = target;
  }

  async init(): Promise<void> {
    await this.worker.run({
      name: ThreadCall.init,
      args: [this.name, this.target]
    });
  }

  async get(
    threadID: number,
    target: Target,

    queries: string[][],
    params: any[][][],

    isLong: boolean
  ): Promise<number[]> {
    return await this.worker.run({
      name: ThreadCall.get,
      args: [
        threadID,
        target,

        queries,
        params,

        isLong
      ]
    });
  }

  async add(
    results: ResultList,
  ): Promise<void> {
    await this.worker.run({
      name: ThreadCall.add,
      args: [
        results.toObject(),
      ]
    });
  }

  async set(
    results: ResultList,
  ): Promise<void> {
    await this.worker.run({
      name: ThreadCall.set,
      args: [
        results.toObject(),
      ]
    });
  }

  async del(
    IDs: number[],
  ): Promise<void> {
    await this.worker.run({
      name: ThreadCall.del,
      args: [
        IDs,
      ]
    });
  }

  async destroy(): Promise<void> {
    if (!this.worker) { return; }

    await this.worker.run({
      name: ThreadCall.destroy,
      args: []
    });

    await this.worker.worker.terminate();
    delete this.worker;
  }
}