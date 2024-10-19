import { Database as DatabaseType } from "better-sqlite3";
import { DBEvent } from "../../entities/DBEvent";
import { DB_ADMIN_NAME, DB_EVENT_TABLE, USER_ADMIN_NAME } from "../../utils/constants";
import { ConnectionAdmin } from "../Connection/ConnectionAdmin";
import { IDBSync } from "./IDBSync";
import { EventType } from "../../entities/EventType";

export class SQLiteDBSync implements IDBSync {
  private conn: ConnectionAdmin;
  private isInit: boolean = false;
  private maxID: number = 0;

  constructor(adminConnection: ConnectionAdmin) {
    this.conn = adminConnection;
  }

  async init(): Promise<void> {
    if (this.isInit) {
      return;
    }

    await this.conn.add();

    const db = this.conn.connection as DatabaseType;

    // Check if the DBs table exists
    const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${DB_EVENT_TABLE}'`).get();
    if (exists) {
      this.isInit = true;
      return;
    }

    db.prepare(`CREATE TABLE ${DB_EVENT_TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      name TEXT,
      enabled BOOLEAN,
      admins TEXT,
      readers TEXT,
      writers TEXT
    )`).run();

    // Add the StarkDBAdmin DB event to the table
    db.prepare(`INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES (?, ?, ?, ?, ?, ?)`).run(
      EventType.add,
      DB_ADMIN_NAME,
      true,
      JSON.stringify([USER_ADMIN_NAME]),
      JSON.stringify([]),
      JSON.stringify([])
    );

    this.isInit = true;
  }

  async get(): Promise<DBEvent[]> {
    await this.init();

    const db = this.conn.connection as DatabaseType;
    // Get all the events from the DB ordered by ID ascending and max ID from the last event
    const events = db.prepare(`SELECT * FROM ${DB_EVENT_TABLE} WHERE id > ? ORDER BY id ASC`).all(this.maxID);

    const result = events.map((event: any) => {
      return {
        id: event.id,
        type: event.type,
        name: event.name,
        enabled: event.enabled,
        admins: JSON.parse(event.admins),
        readers: JSON.parse(event.readers),
        writers: JSON.parse(event.writers)
      };
    }) as DBEvent[];

    // Get the max ID from the last event
    if (result.length > 0) {
      this.maxID = result[result.length - 1].id;
    }

    return result;
  }

  async add(event: Partial<DBEvent>): Promise<void> {
    await this.init();

    const db = this.conn.connection as DatabaseType;
    db.prepare(`INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES (?, ?, ?, ?, ?, ?)`).run(
      EventType.add,
      event.name,
      event.enabled,
      JSON.stringify(event.admins),
      JSON.stringify(event.readers),
      JSON.stringify(event.writers)
    );
  }

  async set(event: Partial<DBEvent>): Promise<void> {
    await this.init();

    const db = this.conn.connection as DatabaseType;
    db.prepare(`INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES (?, ?, ?, ?, ?, ?)`).run(
      EventType.set,
      event.name,
      event.enabled,
      JSON.stringify(event.admins),
      JSON.stringify(event.readers),
      JSON.stringify(event.writers)
    );
  }

  async delete(event: Partial<DBEvent>): Promise<void> {
    await this.init();

    const db = this.conn.connection as DatabaseType;
    db.prepare(`INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES (?, ?, ?, ?, ?, ?)`).run(
      EventType.del,
      event.name,
      event.enabled,
      JSON.stringify(event.admins),
      JSON.stringify(event.readers),
      JSON.stringify(event.writers)
    );
  }

}