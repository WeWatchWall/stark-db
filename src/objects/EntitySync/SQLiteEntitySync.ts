import {
  createSqlite3Persister, Sqlite3Persister
} from "tinybase/persisters/persister-sqlite3";
import { EntitySyncBase } from "./EntitySyncBase";
import { createStore } from "tinybase/store";
import { ConnectionAdmin } from "../Connection/ConnectionAdmin";

export class SQLiteEntitySync extends EntitySyncBase {
  async get() {
    await this.init();
    return this.store;
  }

  private persister: Sqlite3Persister;
  private async init() {
    if (this.isInit) return;

    this.connection = new ConnectionAdmin();

    this.store = createStore();
    this.store.setTablesSchema(this.schema);
    this.store.setTable('DBs', {});

    this.persister = createSqlite3Persister(
      this.store, this.connection.connection, this.config
    );
    await this.persister.startAutoSave();
    await this.persister.startAutoLoad();
    
    this.isInit = true;
  }

  async destroy() {
    this.persister.destroy();
  }
}