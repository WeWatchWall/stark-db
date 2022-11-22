import { Results } from '../objects/results';
import { target } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { ICaller, ISaver } from './IThreads';

export class SaverCallerBase implements ICaller, ISaver {
  target: target;
  worker: any;

  constructor(target: target) {
    this.target = target;
  }

  async init(): Promise<void> {
    await this.worker.run({
      name: PersistCall.init,
      args: [this.target]
    });
  }

  async add(
    id: number,
    target: target,
    results: Results
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