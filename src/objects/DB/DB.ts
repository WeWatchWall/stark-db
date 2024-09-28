import { useOptionsStore } from "../../stores/options";
import { IDB, IDBArg } from "./IDB";
import { PGDB } from "./PGDB";
import { SQLiteDB } from "./SQLiteDB";

export class DB implements IDB {
  private driver: IDB;

  constructor(arg: IDBArg) {
    const optionsStore = useOptionsStore();
    if (optionsStore.engine === "SQLite") {
      this.driver = new SQLiteDB(arg);
    } else if (optionsStore.engine === "PostgreSQL") {
      this.driver = new PGDB(arg);
    } else {
      throw new Error("Unsupported database engine");
    }
  }

  get name() {
    return this.driver.name;
  }
  set name(_name: string) {
    throw new Error("Invalid operation.");
  }

  async get() {
    return await this.driver.get();
  }

  async add() {
    if (await this.driver.get()) {
      throw new Error("Database already exists");
    }
    await this.driver.add();
  }

  async delete() {
    if (!(await this.driver.get())) {
      throw new Error("Database does not exist");
    }
    await this.driver.delete();
  }

  async set(name: string) {
    if (!(await this.driver.get())) {
      throw new Error("Database does not exist");
    }
    await this.driver.set(name);
  }
}