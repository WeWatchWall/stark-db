import {
  createPostgresPersister,
  PostgresPersister
} from "tinybase/persisters/persister-postgres";
import { createStore } from "tinybase/store";
import { EntitySyncBase } from "./EntitySyncBase";

export class PGEntitySync extends EntitySyncBase {
  async get() {
    await this.init();
    return this.store;
  }

  private persister: PostgresPersister;
  private async init() {
    if (this.isInit) return;

    if (!await this.connection.get()) {
      await this.connection.add();
    }

    this.store = createStore();
    this.store.setTablesSchema(this.schema);
    this.store.setTable('DBs', {});

    this.persister = await createPostgresPersister(
      this.store, this.connection.connection, this.config
    );
    await this.persister.startAutoLoad();
    await this.persister.startAutoSave();
    this.isInit = true;
  }

  async destroy() {
    this.persister.destroy();
  }
}