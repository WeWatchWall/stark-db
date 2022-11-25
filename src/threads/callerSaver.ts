import { Results } from '../objects/results';
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

  async add(
    id: number,
    target: Target,
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