import { defineStore } from 'pinia';
import { useEntitySyncStore } from './EntitySync';

export const useDBsStore = defineStore('DBs', () => {

  async function get(id: string) {
    const store = await useEntitySyncStore().get();
    return store.getRow('DBs', id);
  }

  async function add(db: { id: string, enabled: boolean, readers: string, writers: string }) {
    const store = await useEntitySyncStore().get();
    store.setRow('DBs', db.id, {
      enabled: db.enabled,
      readers: db.readers,
      writers: db.writers
    });
  }

  async function set(id: string, db: Partial<{ enabled: boolean, readers: string, writers: string }>) {
    const store = await useEntitySyncStore().get();
    store.setRow('DBs', id, db);
  }

  async function del(id: string) {
    const store = await useEntitySyncStore().get();
    store.delRow('DBs', id);
  }

  return {
    get,
    add,
    set,
    del,
  }
});