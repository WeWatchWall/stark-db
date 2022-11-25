import sqlite3 from 'sqlite3';
import { DataSource } from 'typeorm';
import { BroadcastChannel } from 'worker_threads';

import { QueueBase } from '../../threads/queue';
import { SaverBase } from '../../threads/saver';
import { WorkerBase } from '../../threads/worker';
import { DB_DRIVER, SAVER_CHANNEL, Target } from '../../utils/constants';

export class Worker extends WorkerBase {
  async init(): Promise<void> {
    // TODO:
    // Init DataSource: this.DB = this.target === targets.DB ? ... : ...
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

export class Saver extends SaverBase {
  async init(): Promise<void> {
    // Set up the Broadcast Channel.
    const channelName = `${SAVER_CHANNEL}-${this.target}-${this.name}`;
    this.channel =
      new BroadcastChannel(channelName);
    this.channel.onmessage =  async (message) => this.callMethod(message);

    // Connect to the DataSource, based conditionally on target.
    switch (this.target) {
      case Target.DB:
        this.DB = new DataSource({
          type: DB_DRIVER,
          database: this.name,
          cache: true,
          synchronize: false,
          logging: false,
          entities: [],
          migrations: [],
          subscribers: [],
        });

        break;
      case Target.mem:
        this.DB = new DataSource({
          type: DB_DRIVER,
          database: `file:${this.name}?mode=memory`,
          flags:
            sqlite3.OPEN_URI |
            sqlite3.OPEN_SHAREDCACHE |
            sqlite3.OPEN_READWRITE |
            sqlite3.OPEN_CREATE,
          cache: true,
          synchronize: false,
          logging: false,
          entities: [],
          migrations: [],
          subscribers: [],
        });

        break;
      default:
        throw new Error(`Invalid target: ${this.target}`);
    }

    await this.DB.initialize();
  }
}