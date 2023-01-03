import { ResultList } from '../objects/resultList';
import { ONE, Target } from '../utils/constants';
import { ThreadCall } from '../utils/threadCall';
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

    queries: string[][],
    params: any[][][],

    isLong: boolean,
    count = ONE
  ): Promise<number[]> {
    return await this.worker.run({
      name: ThreadCall.get,
      args: [
        threadID,

        queries,
        params,

        isLong,
        count
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