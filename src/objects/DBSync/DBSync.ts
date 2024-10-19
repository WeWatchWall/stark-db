import { DBEvent } from "../../entities/DBEvent";
import { useOptionsStore } from "../../stores/options";
import { ConnectionAdmin } from "../Connection/ConnectionAdmin";
import { IDBSync } from "./IDBSync";
import { PGDBSync } from "./PGDBSync";
import { SQLiteDBSync } from "./SQLiteDBSync";

export class DBSync implements IDBSync {
  private driver: IDBSync;

  constructor(adminConnection: ConnectionAdmin) {
    const optionsStore = useOptionsStore();
    if (optionsStore.engine === "SQLite") {
      this.driver = new SQLiteDBSync(adminConnection);
    } else if (optionsStore.engine === "PostgreSQL") {
      this.driver = new PGDBSync(adminConnection);
    } else {
      throw new Error("Unsupported database engine");
    }
  }

  init(): Promise<void> {
    return this.driver.init();
  }
  get(): Promise<DBEvent[]> {
    return this.driver.get();
  }
  add(event: Partial<DBEvent>): Promise<void> {
    return this.driver.add(event);
  }
  set(event: Partial<DBEvent>): Promise<void> {
    return this.driver.set(event);
  }
  delete(event: Partial<DBEvent>): Promise<void> {
    return this.driver.delete(event);
  }
  
}