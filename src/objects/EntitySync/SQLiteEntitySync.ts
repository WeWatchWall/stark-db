import {
  createSqlite3Persister, Sqlite3Persister
} from "tinybase/persisters/persister-sqlite3";
import { EntitySyncBase } from "./EntitySyncBase";
import { createStore } from "tinybase/store";

export class SQLiteEntitySync extends EntitySyncBase {
  async get() {
    await this.init();
    return this.store;
  }

  private persister: Sqlite3Persister;
  private async init() {
    if (this.isInit) return;

    if (!await this.connection.get()) {
      await this.connection.add();
    }

    this.store = createStore();
    this.store.setTablesSchema(this.schema);
    this.store.setTable('DBs', {});

    this.persister = createSqlite3Persister(
      this.store, this.connection.connection, this.config
    );
    await this.persister.startAutoLoad();
    await this.persister.startAutoSave();
    this.isInit = true;
  }

  async delete() {
    this.persister.destroy();
  }
}