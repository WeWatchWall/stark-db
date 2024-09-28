import { useOptionsStore } from "../../stores/options";
import { IConnection } from "./IConnection";
import { PGConnection } from "./PGConnection";
import { SQLiteConnection } from "./SQLiteConnection";

export abstract class ConnectionBase implements IConnection {
  private driver: IConnection;

  constructor(name: string) {
    const optionsStore = useOptionsStore();
    this.driver = optionsStore.engine === "SQLite" ?
      new SQLiteConnection({ name }) :
      new PGConnection({ name });
  }

  get name(): string {
    return this.driver.name;
  }
  set name(_name: string) {
    throw new Error("Invalid operation.");
  }

  get connection() {
    return this.driver.connection;
  }
  set connection(_connection: any) {
    throw new Error("Invalid operation.");
  }

  async get(): Promise<boolean> {
    return await this.driver.get();
  }

  async add() {
    if (!await this.driver.get()) {
      await this.driver.add();      
    }
  }

  async delete() {
    await this.driver.delete();
  }
}