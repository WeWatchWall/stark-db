import { DataSource } from "typeorm";
import { DBFile as DBFileObject } from "../objects/DBFile";
import { CONNECTION_EXPIRY } from "../utils/constants";

class DBFileEntry {
  lastQuery: number;
  DBFile: DBFileObject;
}

export class DBFile implements Disposable {
  store: Map<string, DBFileEntry>;
  interval: NodeJS.Timeout;

  constructor() {
    this.store = new Map();
    this.interval = setInterval(async () => {
      for (const key of this.store.keys()) {
        const { sessionID, name } = JSON.parse(key);
        await this.delete(sessionID, name);
      }
    }, CONNECTION_EXPIRY);
  }

  async add(sessionID: string, name: string): Promise<DataSource> {
    const key = JSON.stringify({ sessionID, name });
    const entry = this.store.get(key);
    if (entry) {
      entry.lastQuery = Date.now();
      return entry.DBFile.DB;
    }

    const DBFile = new DBFileObject({
      name,
      types: [],
    });
    await DBFile.load();

    const newEntry = {
      lastQuery: Date.now(),
      DBFile,
    };

    this.store.set(key, newEntry);
    return DBFile.DB;
  }

  get(sessionID: string, name: string): DataSource {
    const key = JSON.stringify({ sessionID, name });
    const entry = this.store.get(key);
    if (!entry) { return; }

    entry.lastQuery = Date.now();
    return entry.DBFile.DB;
  }

  async delete(sessionID: string, name: string): Promise<void> {
    const key = JSON.stringify({ sessionID, name });
    const entry = this.store.get(key);
    if (!entry) { return; }

    if (entry.lastQuery > Date.now() - CONNECTION_EXPIRY) {
      await entry.DBFile[Symbol.asyncDispose]();
      this.store.delete(key);
    }
  }

  [Symbol.dispose](): void {
    clearInterval(this.interval);
  }
}