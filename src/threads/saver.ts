import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { Results } from '../objects/results';
import {
  PARAMETER_TOKEN,
  STATEMENT_DELIMITER,
  Target,
  VALUE_DELIMITER,
  ZERO
} from '../utils/constants';
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
      !results.results
    ) {
      await this.set(results);
      return;
    }

    for (const result of results.results) {
      const queryParts: string[] = [
        `INSERT OR REPLACE INTO ${result.name} VALUES `,
      ];
      const queryParams: any[] = [];

      let rowKeys: string[];
      for (let index = 0; index <result.rows.length; index++) {
        const row = result.rows[index];
        if (rowKeys == undefined) { rowKeys = Object.keys(row); }
        const rowParts: string[] = [];

        for (const key of rowKeys) {
          rowParts.push(PARAMETER_TOKEN);
          queryParams.push(row[key]);
        }

        const rowDelimiter = index === ZERO ? `` : VALUE_DELIMITER;
        queryParts.push(`${rowDelimiter}(${rowParts.join(VALUE_DELIMITER)})`);
      }

      queryParts.push(STATEMENT_DELIMITER);

      await this.DB.query(queryParts.join(``), queryParams);
    }

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