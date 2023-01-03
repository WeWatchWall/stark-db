import { ResultList } from '../objects/resultList';
import { Target } from '../utils/constants';
import { ThreadCall } from '../utils/threadCall';
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

  async get(target: Target, threadID: number, commitIDs: number[]): Promise<void> {
    return await this.worker.run({
      name: ThreadCall.get,
      args: [
        target,
        threadID,
        commitIDs,
      ]
    });
  }

  async set(target: Target, results: ResultList): Promise<void> {
    return await this.worker.run({
      name: ThreadCall.set,
      args: [
        target,
        results,
      ]
    });
  }

  async del(target: Target, commitID: number): Promise<void> {
    return await this.worker.run({
      name: ThreadCall.del,
      args: [
        target,
        commitID
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