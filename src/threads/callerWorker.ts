import { ResultList } from '../objects/resultList';
import { WorkerCall } from '../utils/threadCalls';
import { ICaller, IWorker } from './IThreads';

export class WorkerCallerBase implements ICaller, IWorker {
  name: string;
  id: number;

  worker: any;

  constructor(name: string, id: number) {
    this.name = name;
    this.id = id;
  }

  async init(): Promise<void> {
    return await this.worker.run({
      name: WorkerCall.init,
      args: [this.name, this.id]
    });
  }

  async run(query: string, args: any[]): Promise<ResultList> {
    return await this.worker.run({
      name: WorkerCall.run,
      args: [
        query,
        args,
      ]
    });
  }

  async destroy(): Promise<void> {
    if (!this.worker) { return; }

    await this.worker.run({
      name: WorkerCall.stop,
      args: []
    });

    await this.worker.worker.terminate();
    delete this.worker;
  }
}