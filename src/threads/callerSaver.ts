import { ResultList } from '../objects/resultList';
import { Target } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { ICaller, ISaver } from './IThreads';

export class SaverCallerBase implements ICaller, ISaver {
  name: string;
  target: Target;

  worker: any;

  constructor(name: string, target: Target) {
    this.name = name;
    this.target = target;
  }

  async init(): Promise<void> {
    await this.worker.run({
      name: PersistCall.init,
      args: [this.name, this.target]
    });
  }

  async get(): Promise<number> {
    return await this.worker.run({
      name: PersistCall.get,
      args: []
    });
  }

  async add(
    results: ResultList
  ): Promise<void> {
    await this.worker.run({
      name: PersistCall.add,
      args: [
        results.toObject(),
      ]
    });
  }

  async del(commit: number): Promise<void> {
    await this.worker.run({
      name: PersistCall.del,
      args: [commit]
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