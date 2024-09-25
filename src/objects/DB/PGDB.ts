import { Client } from "pg";

import { IDB, IDBSchema } from "./IDB";
import { useOptionsStore } from "../../stores/options";

export class PGDB implements IDB {
  name: string;

  client: Client;

  constructor(arg: Partial<PGDB>) {
    IDBSchema.parse(arg);
    Object.assign(this, arg);

    const CLIStore = useOptionsStore();

    this.client =  new Client({
      user: CLIStore.pguser,
      host: CLIStore.pghost,
      password: CLIStore.pgpassword,
      port: CLIStore.pgport,
    });
  }

  // Get whether there exists a PostgreSQL database.
  async get() {
    try {
      await this.client.connect();
      const res = await this.client.query(`SELECT 1 FROM pg_database WHERE datname = '${this.name}'`);
      return res.rowCount === 1;
    } finally {
      await this.client.end(); 
    }
  }

  // Create a new empty PostgreSQL database.
  async add() {
    try {
      await this.client.connect();
      await this.client.query(`CREATE DATABASE ${this.name}`);
    } finally {
      await this.client.end(); 
    }
  }

  // Remove an existing PostgreSQL database.
  async delete() {
    try {
      await this.client.connect();
      await this.client.query(`DROP DATABASE ${this.name}`);
    } finally {
      await this.client.end(); 
    }
  }

  // Rename an existing PostgreSQL database.
  async set(name: string) {
    try {
      await this.client.connect();
      await this.client.query(`ALTER DATABASE ${this.name} RENAME TO ${name}`);
      this.name = name;
    } finally {
      await this.client.end(); 
    }
  }
}