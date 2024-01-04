import { DataSource } from "typeorm";

import { AdminDB, DBBase } from "../objects/DB";
import { DBFile as DBFileObject } from "../objects/DBFile";
import { CONNECTION_EXPIRY, DB_EXISTS_CHECK } from "../utils/constants";

class DBFileEntry {
  lastQuery: number;
  DBFile: DBFileObject;
  DB: DBBase;
}

export class DBFile implements Disposable {
  store: Map<string, DBFileEntry>;

  private adminDB: AdminDB;
  
  private logoutInterval: NodeJS.Timeout;
  private deleteInterval: NodeJS.Timeout;

  private DBs: Set<string>;

  constructor(adminDB: AdminDB) {
    this.adminDB = adminDB;

    this.store = new Map();
    this.logoutInterval = setInterval(async () => {
      for (const key of this.store.keys()) {
        const entry = this.store.get(key);

        if (entry.lastQuery < Date.now() - CONNECTION_EXPIRY) { continue; }

        const { sessionID, name } = JSON.parse(key);
        await this.delete(sessionID, name);
      }
    }, CONNECTION_EXPIRY);

    this.DBs = new Set();
    this.deleteInterval = setInterval(async () => {
      const queriedDBs = (await this
          .adminDB
          .DB
          .query(`SELECT name FROM DB;`)
        ).map((queriedDB: { name: string }) => queriedDB.name);

      // Add unkown DBs to the known set.
      for (const DBName of queriedDBs) {
        this.DBs.add(DBName);
      }

      // Delete known DBs from the known store.
      const queriedDBsSet = new Set(queriedDBs);
      for (const key of this.store.keys()) {
        const { sessionID, name } = JSON.parse(key);
        if (queriedDBsSet.has(name)) { continue; }

        await this.delete(sessionID, name);        
      }
    }, DB_EXISTS_CHECK);
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
    if (!entry) { return { DB: undefined,  connection: undefined }; }

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
    clearInterval(this.logoutInterval);
    clearInterval(this.deleteInterval);
  }
}