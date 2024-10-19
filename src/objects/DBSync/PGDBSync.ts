import { Client } from 'pg';
import { DBEvent } from '../../entities/DBEvent';
import { DB_ADMIN_NAME, DB_EVENT_TABLE, USER_ADMIN_NAME } from '../../utils/constants';
import { ConnectionAdmin } from '../Connection/ConnectionAdmin';
import { IDBSync } from './IDBSync';
import { EventType } from '../../entities/EventType';

export class PGDBSync implements IDBSync {
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

    const client = this.conn.connection as Client;

    // Check if the DB_EVENT_TABLE exists
    const tableCheckResult = await client.query(
      `SELECT to_regclass('${DB_EVENT_TABLE}')`
    );

    if (tableCheckResult.rows[0].to_regclass) {
      this.isInit = true;
      return;
    }

    // Create the table
    await client.query(`
      CREATE TABLE ${DB_EVENT_TABLE} (
        id SERIAL PRIMARY KEY,
        type TEXT,
        name TEXT,
        enabled BOOLEAN,
        admins JSONB,
        readers JSONB,
        writers JSONB
      )
    `);

    // Add the StarkDBAdmin DB event to the table
    await client.query(
      `INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        EventType.add,
        DB_ADMIN_NAME,
        true,
        JSON.stringify([USER_ADMIN_NAME]),
        JSON.stringify([]),
        JSON.stringify([])
      ]
    );

    this.isInit = true;
  }

  async get(): Promise<DBEvent[]> {
    await this.init();

    const client = this.conn.connection as Client;

    // Get all the events from the DB ordered by ID ascending and max ID from the last event
    const result = await client.query(
      `SELECT * FROM ${DB_EVENT_TABLE} WHERE id > $1 ORDER BY id ASC`,
      [this.maxID]
    );

    const events = result.rows.map((event: any) => {
      return {
        id: event.id,
        type: event.type,
        name: event.name,
        enabled: event.enabled,
        admins: event.admins,
        readers: event.readers,
        writers: event.writers
      } as DBEvent;
    });

    // Get the max ID from the last event
    if (events.length > 0) {
      this.maxID = events[events.length - 1].id;
    }

    return events;
  }

  async add(event: Partial<DBEvent>): Promise<void> {
    await this.init();

    const client = this.conn.connection as Client;

    await client.query(
      `INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        EventType.add,
        event.name,
        event.enabled,
        JSON.stringify(event.admins),
        JSON.stringify(event.readers),
        JSON.stringify(event.writers)
      ]
    );
  }

  async set(event: Partial<DBEvent>): Promise<void> {
    await this.init();

    const client = this.conn.connection as Client;

    await client.query(
      `INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        EventType.set,
        event.name,
        event.enabled,
        JSON.stringify(event.admins),
        JSON.stringify(event.readers),
        JSON.stringify(event.writers)
      ]
    );
  }

  async delete(event: Partial<DBEvent>): Promise<void> {
    await this.init();

    const client = this.conn.connection as Client;

    await client.query(
      `INSERT INTO ${DB_EVENT_TABLE} (type, name, enabled, admins, readers, writers) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        EventType.del,
        event.name,
        event.enabled,
        JSON.stringify(event.admins),
        JSON.stringify(event.readers),
        JSON.stringify(event.writers)
      ]
    );
  }
}