import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Results } from '../objects/results';
import { Target, ZERO } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { IEngine, ISaver } from './IThreads';

export abstract class SaverBase implements ISaver, IEngine {
  name: string;
  target: Target;

  DB: DataSource;
  channel: BroadcastChannel;

  constructor(name: string, target: Target) {
    this.name = name;
    this.target = target;
  }

  abstract init(): Promise<void>;

  async add(results: Results): Promise<void> {
    if (
      !results ||
      !results.isWrite ||
      results.isLong ||
      results.results.length === ZERO
    ) {
      await this.set(results);
      return;
    }

    this.DB.query(`BEGIN TRANSACTION;`);
    for (const update of results.toUpdate()) {
      if (update.params.length == ZERO) { continue; }
      await this.DB.query(update.query, update.params);
    }
    this.DB.query(`COMMIT TRANSACTION;`);

    await this.set(results);
  }

  async set(results: Results): Promise<void> {
    this.channel.postMessage({
      name: PersistCall.set,
      args: [results.id]
    });
  }

  async destroy(): Promise<void> {
    if (this.channel == undefined) { return; }

    // Clean up the Broadcast Channel.
    this.channel.close();
    delete this.channel;

    // Clean up the DataSource.
    await this.DB.destroy();
    delete this.DB;
  }

  protected async callMethod(event: any): Promise<any> {
    const { name, args }: {
      name: PersistCall, args: any[]
    } = event.data;

    switch (name) {
      case PersistCall.add:
        return await this.add(Results.init(args[0]));
      case PersistCall.destroy:
        return await this.destroy();
      default:
        break;
    }
  }
}