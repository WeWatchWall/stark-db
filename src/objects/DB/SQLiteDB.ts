import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as fs from "fs";
import { computed, Ref } from "vue";


import { IDB, IDBSchema } from "./IDB";
import { useOptionsStore } from "../../stores/options";

export class SQLiteDB implements IDB {
  name: string;

  private fileName: Ref<string>;

  constructor(arg: Partial<SQLiteDB>) {
    IDBSchema.parse(arg);
    Object.assign(this, arg);

    const optionsStore = useOptionsStore();
    this.fileName = computed(() => `${optionsStore.data}/${this.name}.sqlite`);
  }

  // Get whether there exists a SQLite database file.
  async get() {
    const fileExists = fs.existsSync(this.fileName.value);
    if (!fileExists) return false;

    let db;
    try {
      db = await open({
        filename: this.fileName.value,
        driver: sqlite3.Database
      });
      return true;
    } catch (error) {
      return false;
    } finally {
      await db?.close();
    }
  }


  // Create a new empty SQLite database file.
  async add() {
    let db;
    
    try {
      db = await open({
        filename: this.fileName.value,
        driver: sqlite3.Database
      });
    } finally {
      await db?.close();
    }
  }

  // Remove an existing SQLite database file.
  async delete() {
    fs.unlinkSync(this.fileName.value);
  }

  // Rename an existing SQLite database file.
  async set(name: string) {
    const optionsStore = useOptionsStore();
    const newFileName = `${optionsStore.data}/${name}.sqlite`;
    fs.renameSync(this.fileName.value, newFileName);
    this.name = name;
  }
}
