import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as fs from "fs";
import { computed } from "vue";
import { z } from "zod";

import { IDB } from "./IDB";

export class SQLiteDB implements IDB {
  name: string;
  path?: string;

  private fileName = computed(() => this.path ? `${this.path}/${this.name}.sqlite` : `${this.name}.sqlite`); 

  constructor(arg: Partial<SQLiteDB>) {
    SQLiteDBSchema.parse(arg);
    Object.assign(this, arg);
  }

  // Create a new empty SQLite database file.
  async add() {
    const db = await open({
      filename: this.fileName.value,
      driver: sqlite3.Database
    });
    await db.close();
  }

  // Remove an existing SQLite database file.
  async delete() {
    fs.unlinkSync(this.fileName.value);
  }

  // Rename an existing SQLite database file.
  async set(name: string) {
    const newFileName = this.path ? `${this.path}/${name}.sqlite` : `${name}.sqlite`;
    fs.renameSync(this.fileName.value, newFileName);
    this.name = name;
  }
}

const SQLiteDBSchema = z.object({
  name: z.string(),
  path: z.string().optional(),
});