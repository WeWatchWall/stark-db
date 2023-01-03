import { ResultList } from '../objects/resultList';
import { Target } from '../utils/constants';
import { ThreadCall } from '../utils/threadCall';
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
      name: ThreadCall.init,
      args: [this.name, this.target]
    });
  }

  async get(): Promise<number> {
    return await this.worker.run({
      name: ThreadCall.get,
      args: []
    });
  }

  async add(
    results: ResultList
  ): Promise<void> {
    await this.worker.run({
      name: ThreadCall.add,
      args: [
        results.toObject(),
      ]
    });
  }

  async del(commit: number): Promise<void> {
    await this.worker.run({
      name: ThreadCall.del,
      args: [commit]
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