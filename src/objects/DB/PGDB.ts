import { Client } from "pg";
import { z } from "zod";

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