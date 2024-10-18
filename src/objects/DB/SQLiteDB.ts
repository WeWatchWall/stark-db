import Database from 'better-sqlite3';
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
    this.fileName = computed(() => `${optionsStore.data}/${this.name}`);
  }

  // Get whether there exists a SQLite database file.
  async get() {
    const fileExists = fs.existsSync(this.fileName.value);
    if (!fileExists) return false;

    let db;
    try {
      db = new Database(this.fileName.value, { fileMustExist: true });
      return true;
    } catch (error) {
      return false;
    } finally {
      db?.close();
    }
  }

  // Create a new empty SQLite database file.
  async add() {
    let db;
    
    try {
      // Check if the path exists, if not create it.
      const optionsStore = useOptionsStore();
      if (!fs.existsSync(optionsStore.data)) {
        fs.mkdirSync(optionsStore.data);
      }

      db = new Database(this.fileName.value);
    } finally {
      db?.close();
    }
  }

  // Remove an existing SQLite database file.
  async delete() {
    fs.unlinkSync(this.fileName.value);
  }

  // Rename an existing SQLite database file.
  async set(name: string) {
    const optionsStore = useOptionsStore();
    const newFileName = `${optionsStore.data}/${name}`;
    fs.renameSync(this.fileName.value, newFileName);
    this.name = name;
  }

  async destroy(): Promise<void> {
    // No need to do anything here.
  }
}
