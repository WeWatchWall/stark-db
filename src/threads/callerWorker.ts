import { ResultList } from '../objects/resultList';
import { ThreadCall } from '../utils/threadCalls';
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
      name: ThreadCall.init,
      args: [this.name, this.id]
    });
  }

  async add(query: string, args: any[]): Promise<ResultList> {
    return await this.worker.run({
      name: ThreadCall.add,
      args: [
        query,
        args,
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