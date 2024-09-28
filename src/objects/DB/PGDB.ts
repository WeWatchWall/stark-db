import { Client } from "pg";

import { IDB, IDBSchema } from "./IDB";
import { useOptionsStore } from "../../stores/options";

export class PGDB implements IDB {
  name: string;

  client: Client;

  private isInit = false;

  constructor(arg: Partial<PGDB>) {
    IDBSchema.parse(arg);
    Object.assign(this, arg);

    const CLIStore = useOptionsStore();

    this.client = new Client({
      user: CLIStore.pguser,
      host: CLIStore.pghost,
      password: CLIStore.pgpassword,
      port: CLIStore.pgport,
    });
  }

  private async init() {
    if (this.isInit) return;

    await this.client.connect();

    this.isInit = true;
  }

  // Get whether there exists a PostgreSQL database.
  async get() {
    await this.init();
    const res = await this.client.query(`SELECT 1 FROM pg_database WHERE datname = '${this.name}'`);
    return res.rowCount === 1;
  }

  // Create a new empty PostgreSQL database.
  async add() {
    await this.init();
    await this.client.query(`CREATE DATABASE ${this.name}`);
  }

  // Remove an existing PostgreSQL database.
  async delete() {
    await this.init();
    await this.client.query(`DROP DATABASE ${this.name}`);
  }

  // Rename an existing PostgreSQL database.
  async set(name: string) {
    await this.init();
    await this.client.query(`ALTER DATABASE ${this.name} RENAME TO ${name}`);
    this.name = name;
  }

  async destroy() {
    await this.client.end();
  }
}