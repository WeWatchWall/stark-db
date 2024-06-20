import fs from "fs";
import path from "path";
import { DataSource } from "typeorm";

import { SQLITE_DRIVER } from "../../utils/constants";
import { IDBDriver } from "../IDBDriver";

export class DBDriver implements IDBDriver {
  async connect(
    database: string,
    entities: Function[] = [],
    schemaSync: boolean = false,

    dataDir: string = "data"
  ): Promise<DataSource> {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const connection = new DataSource({
      type: SQLITE_DRIVER,
      database: path.resolve(dataDir, `${database}.db`),
      cache: false,
      synchronize: schemaSync,
      logging: false,
      entities: entities,
      migrations: [],
      subscribers: [],
    });

    await connection.initialize();

    return connection;
  }

  async disconnect(connection: DataSource): Promise<void> {
    await connection.destroy();
  }

  async provision(connection: DataSource): Promise<void> {
    await connection.query(`PRAGMA busy_timeout = 30000;`);
    await connection.query(`PRAGMA journal_mode = WAL;`);
  }

  async createDB(_name: string): Promise<void> {
    // NOOP: SQLite creates the database file on connection.
  }

  async renameDB(
    oldName: string,
    newName: string,

    dataDir: string = "data"
  ): Promise<void> {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const oldPath = path.resolve(dataDir, `${oldName}.db`);
    const newPath = path.resolve(dataDir, `${newName}.db`);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    }
  }

  async deleteDB(name: string, dataDir: string = "data"): Promise<void> {
    const dbPath = path.resolve(dataDir, `${name}.db`);

    if (fs.existsSync(dbPath)) {
      fs.rmSync(dbPath);
      fs.rmSync(`${dbPath}-shm`, { force: true });
      fs.rmSync(`${dbPath}-wal`, { force: true });
    }
  }
}