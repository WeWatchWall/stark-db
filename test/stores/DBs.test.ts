import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import { setActivePinia, createPinia } from 'pinia';
import { useOptionsStore } from '../../src/stores/options';
import { useDBsStore } from '../../src/stores/DBs';
import { DB } from '../../src/objects/DB/DB';
import { DB_ADMIN_NAME } from '../../src/utils/constants';
import { useEntitySyncStore } from '../../src/stores/EntitySync';

describe('useDBsStore End-to-End Tests', () => {
  const sampleDB = {
    id: 'test-db',
    enabled: true,
    readers: JSON.stringify(['reader1', 'reader2']),
    writers: JSON.stringify(['writer1', 'writer2'])
  };

  function initializeStore(engine: 'SQLite' | 'PostgreSQL') {
    const optionsStore = useOptionsStore();
    optionsStore.engine = engine;
    optionsStore.data = './test/data';
    const dbsStore = useDBsStore();
    return dbsStore;
  }

  ['SQLite', 'PostgreSQL'].forEach(engine => {
    describe(`${engine} Tests`, () => {
      let dbsStore: ReturnType<typeof useDBsStore>;

      before(async () => {
        setActivePinia(createPinia());

        dbsStore = initializeStore(engine as 'SQLite' | 'PostgreSQL');

        // Initialize the admin database.
        const db = new DB({ name: DB_ADMIN_NAME });
        await db.add();
        await db.destroy();
      });

      after(async () => {
        // Call del on the EntitySync store.
        const entitySyncStore = useEntitySyncStore();
        await entitySyncStore.destroy();

        // Delete the admin database.
        const db = new DB({ name: DB_ADMIN_NAME });
        await db.delete();
        await db.destroy();
      });

      it('should add a DB entry', async () => {
        await dbsStore.add(sampleDB);
        const result = await dbsStore.get(sampleDB.id);
        expect(result).to.deep.equal({
          enabled: sampleDB.enabled,
          readers: sampleDB.readers,
          writers: sampleDB.writers
        });
      });

      it('should get a DB entry', async () => {
        const result = await dbsStore.get(sampleDB.id);
        expect(result).to.deep.equal({
          enabled: sampleDB.enabled,
          readers: sampleDB.readers,
          writers: sampleDB.writers
        });
      });

      it('should set (update) a DB entry', async () => {
        const updatedData = {
          enabled: false,
          readers: JSON.stringify(['reader3']),
        };
        await dbsStore.set(sampleDB.id, updatedData);
        const result = await dbsStore.get(sampleDB.id);
        expect(result).to.include({
          enabled: false,
          readers: JSON.stringify(['reader3'])
        });
      });

      it('should delete a DB entry', async () => {
        await dbsStore.del(sampleDB.id);
        const result = await dbsStore.get(sampleDB.id);
        expect(result).to.deep.equal({});
      });
    });
  });
});