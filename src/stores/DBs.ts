import { defineStore } from 'pinia';
import { createStore } from 'tinybase';
import {
  createPostgresPersister
} from 'tinybase/persisters/persister-postgres';
import { createSqlite3Persister } from 'tinybase/persisters/persister-sqlite3';
import { ref } from 'vue';

import { ConnectionAdmin } from '../objects/Connection/ConnectionAdmin';
import { DB } from '../objects/DB/DB';
import { DB_ADMIN_NAME } from '../utils/constants';
import { useOptionsStore } from './options';

export const useDBsStore = defineStore('DBs', () => {
  const isInit = ref(false);
  const store = createStore();

  async function init() {
    if (isInit.value) return;

    const database = new DB({ name: DB_ADMIN_NAME });
    if (!await database.get()) {
      await database.add();
    }
    const connection = new ConnectionAdmin();
    await connection.add();

    store.setTablesSchema({
      DBs: {
        id: { type: 'string' },
        enabled: { type: 'boolean' },
        readers: { type: 'string' }, // JSON stringified array
        writers: { type: 'string' }, // JSON stringified array
      },
    });

    // Initialize the 'DB' table
    store.setTable('DBs', {});

    let persister;
    const optionsStore = useOptionsStore();
    if (optionsStore.engine === 'SQLite') {
      persister = createSqlite3Persister(store, connection.connection, {
        mode: 'tabular',
        tables: { load: { DBs: 'DBs' }, save: { DBs: 'DBs' } }
      });
    } else if (optionsStore.engine === 'PostgreSQL') {
      persister = await createPostgresPersister(store, connection.connection, {
        mode: 'tabular',
        tables: { load: { DBs: 'DBs' }, save: { DBs: 'DBs' } }
      });
    }

    await persister.startAutoLoad();
    await persister.startAutoSave();
    isInit.value = true;
  }

  async function get(id: string) {
    await init();
    return store.getRow('DBs', id);
  }

  async function add(db: { id: string, enabled: boolean, readers: string, writers: string }) {
    await init();
    store.setRow('DBs', db.id, {
      enabled: db.enabled,
      readers: db.readers,
      writers: db.writers
    });
  }

  async function set(id: string, db: Partial<{ enabled: boolean, readers: string, writers: string }>) {
    await init();
    store.setRow('DBs', id, db);
  }

  async function del(id: string) {
    if (!isInit.value) {
      await init();
    }

    store.delRow('DBs', id);
  }

  return {
    get,
    add,
    set,
    del,
  }
});