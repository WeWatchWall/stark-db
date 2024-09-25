import { useOptionsStore } from "../../stores/options";
import { IDB } from "./IDB";
import { PGDB } from "./PGDB";
import { SQLiteDB } from "./SQLiteDB";

export class DB implements IDB {
  private db: IDB;

  constructor(arg: {name: string}) {
    const optionsStore = useOptionsStore();
    if (optionsStore.engine === "SQLite") {
      this.db = new SQLiteDB(arg as Partial<SQLiteDB>);
    } else if (optionsStore.engine === "PostgreSQL") {
      this.db = new PGDB(arg as Partial<PGDB>);
    } else {
      throw new Error("Unsupported database engine");
    }
  }

  get name() {
    return this.db.name;
  }
  set name(name: string) {
    this.db.name = name;
  }

  async get() {
    return await this.db.get();
  }

  async add() {
    if (await this.db.get()) {
      throw new Error("Database already exists");
    }
    await this.db.add();
  }

  async delete() {
    if (!(await this.db.get())) {
      throw new Error("Database does not exist");
    }
    await this.db.delete();
  }

  async set(name: string) {
    if (!(await this.db.get())) {
      throw new Error("Database does not exist");
    }
    await this.db.set(name);
  }
}