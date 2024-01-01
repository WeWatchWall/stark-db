import { DataSource } from "typeorm";

import { DBBase } from "../objects/DB";
import { DBFile as DBFileObject } from "../objects/DBFile";
import { CONNECTION_EXPIRY } from "../utils/constants";

class DBFileEntry {
  lastQuery: number;
  DBFile: DBFileObject;
  DB: DBBase;
}

export class DBFile implements Disposable {
  store: Map<string, DBFileEntry>;
  interval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();
    this.interval = setInterval(async () => {
      for (const key of this.store.keys()) {
        const entry = this.store.get(key);

        if (entry.lastQuery < Date.now() - CONNECTION_EXPIRY) { continue; }

        const { sessionID, name } = JSON.parse(key);
        await this.delete(sessionID, name);
      }
    }, CONNECTION_EXPIRY);
  }

  async add(sessionID: string, DB: DBBase): Promise<DataSource> {
    const key = JSON.stringify({ sessionID, name: DB.name });
    const entry = this.store.get(key);
    if (entry) {
      entry.lastQuery = Date.now();
      return entry.DBFile.DB;
    }

    const DBFile = new DBFileObject({
      name: DB.name,
      types: [],
    });
    await DBFile.load();

    const newEntry: DBFileEntry = {
      lastQuery: Date.now(),
      DBFile,
      DB,
    };

    this.store.set(key, newEntry);
    return DBFile.DB;
  }

  get(sessionID: string, name: string): {
    DB: DBBase;
    connection: DataSource;
  } {
    const key = JSON.stringify({ sessionID, name });
    const entry = this.store.get(key);
    if (!entry) { return; }

    entry.lastQuery = Date.now();
    return {
      DB: entry.DB,
      connection: entry.DBFile.DB,
    };
  }

  async delete(sessionID: string, name: string): Promise<void> {
    const key = JSON.stringify({ sessionID, name });
    const entry = this.store.get(key);
    if (!entry) { return; }

    await entry.DBFile[Symbol.asyncDispose]();
    this.store.delete(key);
  }

  [Symbol.dispose](): void {
    clearInterval(this.interval);
  }
}