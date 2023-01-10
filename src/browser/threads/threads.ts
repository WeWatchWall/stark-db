import localforage from 'localforage';
import initSqlJs from 'sql.js';
import { DataSource } from 'typeorm';

import { Commit } from '../../entity/commit';
import { CommitList } from '../../objects/commitList';
import { ResultList } from '../../objects/resultList';
import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';
import { Target } from '../../utils/constants';
import { Thread } from '../../utils/thread';

export class Queue extends QueueBase {
  async init(): Promise<void> {
    // Set up the broadcast channels.
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage = async (message: any) => this.callMethod(message);
    
    // Connect to the saver broadcast channel.
    super.saverIn = new BroadcastChannel(this.saverInName);
    super.saverOut = new BroadcastChannel(this.saverOutName);
    this.saverOut.onmessage = async (message: any) => this.callMethod(message);

    // Doesn't connect to the DataSource because it's in memory.
    // super.DB = await getDBConnection(this.name, this.target);
    // await this.DB.initialize();
    // ...doesn't run all the transactions until they are caught up.
  }
}

// Usage: The browser should wait until everything is saved before closing.
export class Saver extends SaverBase {
  async init(): Promise<void> {
    // Set up the Broadcast Channel.
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage =  async (message: any) => this.callMethod(message);

    // Connect to the DataSource.
    super.DB = await getDBConnection(this.name, this.target);
    await this.DB.initialize();
  }
}

export class Worker extends WorkerBase {
  async init(): Promise<void> {
    // Set up the Broadcast channels.
    super.in = new BroadcastChannel(this.inName);
    super.out = new BroadcastChannel(this.outName);
    this.in.onmessage = async (message: any) => this.callMethod(message, Thread.Worker);

    super.queueDBOut = new BroadcastChannel(this.queueDBOutName);
    this.queueDBOut.onmessage =
      async (message: any) => this.callMethod(message, Thread.Queue, Target.DB);

    super.saverDBOut = new BroadcastChannel(this.saverDBOutName);
    this.saverDBOut.onmessage =
      async (message: any) => this.callMethod(message, Thread.Saver, Target.DB);

    // Connect to the DataSources.
    super.DB = await getDBConnection(this.name, Target.DB);
    await this.DB.initialize();
  }

  protected runDry(_query: string, _args: any[], _commitListDB: CommitList, _hasUpdate?: boolean): Promise<[ResultList[], ResultList[], boolean]> {
    throw new Error('Method not implemented.');
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