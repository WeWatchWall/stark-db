import { DataSource } from 'typeorm';

import { Commit } from '../entity/commit';
import { Results } from '../objects/results';
import { SAVER_CHANNEL, Target, ZERO } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { IEngine, ISaver } from './IThreads';

export abstract class SaverBase implements ISaver, IEngine {
  name: string;
  target: Target;

  DB: DataSource;
  channel: any;
  channelName: string;

  constructor(name: string, target: Target) {
    this.name = name;
    this.target = target;
    this.channelName = `${SAVER_CHANNEL}-${this.target}-${this.name}`;
  }

  abstract init(): Promise<void>;

  async add(results: Results): Promise<void> {
    if (
      !results ||
      results.isLong ||
      results.isLongQuery ||
      results.results.length === ZERO
    ) {
      await this.addCommit(results);
      await this.set(results);
      return;
    }

    this.DB.query(`BEGIN TRANSACTION;`);
    for (const update of results.toUpdate()) {
      if (update.params.length == ZERO) { continue; }
      await this.DB.query(update.query, update.params);
    }
    this.DB.query(`COMMIT TRANSACTION;`);
    // TODO: This isn't atomic!
    await this.addCommit(results);

    await this.set(results);
  }

  private async addCommit(results: Results): Promise<void> {
    if (!results || this.target !== Target.DB) { return; }

    const commit = new Commit({
      id: results.id,
      isSaved: true,
      isLong: results.isLong,
      isLongQuery: results.isLongQuery,
    });

    await this.DB.manager.save(commit);
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