import localforage from 'localforage';
import initSqlJs from 'sql.js';
import { DataSource } from 'typeorm';

import { Commit } from '../../entity/commit';
import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';
import { Target } from '../../utils/constants';

export class Worker extends WorkerBase {
  async init(): Promise<void> {
    // TODO:
    // Init DataSource: this.target === targets.DB ? this.DB = ...
    // Setup Broadcast Channel(s)
    throw new Error("Method not implemented.");
  }
}

export class Queue extends QueueBase {
  async init(): Promise<void> {
    // TODO:
    // Setup Broadcast Channel(s)
    throw new Error("Method not implemented.");
  }
}

// Usage: The browser should wait until everything is saved before closing.
export class Saver extends SaverBase {
  async init(): Promise<void> {
    // Set up the Broadcast Channel.
    super.channel = new BroadcastChannel(this.channelName);
    this.channel.onmessage =  async (message: any) => this.callMethod(message);

    // Connect to the DataSource, based conditionally on target.
    super.DB = await getDBConnection(this.name, this.target);

    await this.DB.initialize();
  }
}

async function getDBConnection(
  name: string,
  _target: Target
): Promise<DataSource> {
  const SQL = await initSqlJs({
    locateFile: (_file: string) => `sql-wasm.wasm`
  });

  let database: Uint8Array = await localforage.getItem(name);
  return new DataSource({
    database: database,
    type: "sqljs",
    driver: SQL,
    synchronize: true, // TODO: remove this in production
    logging: false,
    entities: [Commit],
    migrations: [],
    subscribers: [],
  });
}