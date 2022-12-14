import { DataSource } from 'typeorm';

import { Commit } from '../entity/commit';
import { Results } from '../objects/results';
import { COMMITS_TABLE, SAVER_CHANNEL, Target, ZERO } from '../utils/constants';
import { PersistCall } from '../utils/threadCalls';
import { IEngine, ISaver } from './IThreads';

export abstract class SaverBase implements ISaver, IEngine {
  name: string;
  target: Target;

  DB: DataSource;
  in: any;
  out: any;
  inName: string;
  outName: string;

  constructor(name: string, target: Target) {
    this.name = name;
    this.target = target;
    this.inName = `${SAVER_CHANNEL}-${this.target}-${this.name}-in`;
    this.outName = `${SAVER_CHANNEL}-${this.target}-${this.name}-out`;
  }

  abstract init(): Promise<void>;

  async get(): Promise<number> {
    if (this.DB == undefined || this.target !== Target.DB) { return ZERO; }

    const maxColumn = `MAX(id)`;
    const currentID =
      await this.DB.query(`SELECT ${maxColumn} FROM ${COMMITS_TABLE};`);

    return currentID?.[0]?.[maxColumn] || ZERO;
  }

  async add(results: Results): Promise<void> {
    if (
      !results ||
      results.isLong ||
      results.isLongQuery ||
      results.results.length === ZERO
    ) {
      await this.addCommit(results);
      await this.del(results.id);
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

    await this.del(results.id);
  }

  private async addCommit(results: Results): Promise<void> {
    if (!results || this.target !== Target.DB) { return; }

    const commit = new Commit({
      id: results.id,
      isSaved: true,
    });

    await this.DB.manager.save(commit);
  }

  async del(commit: number): Promise<void> {
    this.out.postMessage({
      name: PersistCall.del,
      args: [commit]
    });
  }

  async destroy(): Promise<void> {
    if (this.in == undefined) { return; }

    // Clean up the Broadcast Channel.
    this.in.close();
    this.out.close();
    delete this.in;
    delete this.out;

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
      default:
        break;
    }
  }
}