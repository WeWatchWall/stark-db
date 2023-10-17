import { rmSync } from 'fs';
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';

import { DBFile } from '../../src/objects/DBFile';
import { ADMIN_NAME, DATA_DIR, ONE } from '../../src/utils/constants';
import { AdminDB, DB } from '../../src/objects/DB';
import { DB as DBEntity } from '../../src/entities/DB';

const USER_DB_NAME = 'userDB';
const USER_DB_NAME_2 = 'userDB2';

const ADMIN_DB_NAME_2 = 'adminDB2';

let adminFile: DBFile;

describe('DBEntity Objects', () => {
  before(async () => {
    rmSync(DATA_DIR, { force: true, recursive: true });

    adminFile = new DBFile({ name: ADMIN_NAME, types: [DBEntity] });
    await adminFile.load();
    await adminFile.setInit();
  });

  after(async () => {
    await adminFile[Symbol.asyncDispose]();
  });

  it('should create an AdminDB entity', async () => {
    const adminDBTest = new AdminDB({ DB: adminFile.DB });
    await adminDBTest.save({
      ID: ONE,
      name: ADMIN_NAME,
      admins: [],
      users: [],
    });

    const entity = await adminFile.DB.manager.findOneByOrFail(DBEntity, {
      ID: ONE,
      name: ADMIN_NAME,
    });
    assert.strictEqual(entity.ID, ONE);
    assert.strictEqual(entity.name, ADMIN_NAME);
  });

  it('should create a DB entity', async () => {
    const DBTest = new DB({ DB: adminFile.DB });
    await DBTest.save({
      name: USER_DB_NAME,
      admins: [],
      users: [],
    });

    const entity = await adminFile.DB.manager.findOneByOrFail(DBEntity, {
      name: USER_DB_NAME,
    });
    assert.strictEqual(entity.ID, 2);
    assert.strictEqual(entity.name, USER_DB_NAME);
  });

  it('should load an AdminDB entity', async () => {
    const adminDBTest = new AdminDB({
      DB: adminFile.DB,
      ID: ONE,
      name: ADMIN_NAME
    });
    await adminDBTest.load();

    assert.strictEqual(adminDBTest.ID, ONE);
    assert.strictEqual(adminDBTest.name, ADMIN_NAME);
    assert.deepStrictEqual(adminDBTest.admins, []);
    assert.deepStrictEqual(adminDBTest.users, []);
  });

  it('should load a DB entity', async () => {
    const DBTest = new DB({
      DB: adminFile.DB,
      ID: 2,
    });
    await DBTest.load();

    assert.strictEqual(DBTest.ID, 2);
    assert.strictEqual(DBTest.name, USER_DB_NAME);
    assert.deepStrictEqual(DBTest.admins, []);
    assert.deepStrictEqual(DBTest.users, []);
  });

  it('should fail to load an incorrect AdminDB entity', async () => {
    const adminDBTest = new AdminDB({
      DB: adminFile.DB,
      ID: 2,
      name: ADMIN_NAME,
    });

    let error;
    try {
      await adminDBTest.load();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it.skip('should fail to load an incorrect DB entity', async () => {
    const DBTest = new DB({
      DB: adminFile.DB,
      ID: ONE,
    });

    let error;
    try {
      await DBTest.load();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should update an AdminDB entity', async () => {
    const adminDBTest = new AdminDB({
      DB: adminFile.DB,
      ID: ONE,
      name: ADMIN_NAME,
    });
    await adminDBTest.load();

    await adminDBTest.save({
      ID: ONE,
      name: ADMIN_NAME,
      admins: [ONE],
      users: [],
    });
    assert.strictEqual(adminDBTest.ID, ONE);
    assert.strictEqual(adminDBTest.name, ADMIN_NAME);
    assert.deepStrictEqual(adminDBTest.admins, [ONE]);
    assert.deepStrictEqual(adminDBTest.users, []);

    const entity = await adminFile.DB.manager.findOneByOrFail(DBEntity, {
      ID: ONE,
      name: ADMIN_NAME,
    });
    assert.strictEqual(entity.ID, ONE);
    assert.strictEqual(entity.name, ADMIN_NAME);
    assert.deepStrictEqual(entity.admins, [ONE]);
    assert.deepStrictEqual(entity.users, []);
  });

  it('should update a DB entity', async () => {
    const DBTest = new DB({
      DB: adminFile.DB,
      ID: 2
    });
    await DBTest.load();

    await DBTest.save({
      ID: 2,
      name: USER_DB_NAME_2,
      admins: [ONE],
      users: [],
    });
    assert.strictEqual(DBTest.ID, 2);
    assert.strictEqual(DBTest.name, USER_DB_NAME_2);
    assert.deepStrictEqual(DBTest.admins, [ONE]);
    assert.deepStrictEqual(DBTest.users, []);

    const entity = await adminFile.DB.manager.findOneByOrFail(DBEntity, {
      ID: 2,
      name: USER_DB_NAME_2,
    });
    assert.strictEqual(entity.ID, 2);
    assert.strictEqual(entity.name, USER_DB_NAME_2);
    assert.deepStrictEqual(entity.admins, [ONE]);
    assert.deepStrictEqual(entity.users, []);
  });

  it('should fail to update an incorrect AdminDB entity', async () => {
    const adminDBTest = new AdminDB({
      DB: adminFile.DB,
    });

    let error;
    try {
      await adminDBTest.save({
        ID: ONE,
        name: ADMIN_DB_NAME_2,
        admins: [ONE],
        users: [],
      });
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it.skip('should fail to update an incorrect DB entity', async () => {
    const DBTest = new DB({
      DB: adminFile.DB,
    });

    let error;
    try {
      await DBTest.save({
        ID: ONE,
        name: ADMIN_NAME,
        admins: [ONE],
        users: [],
      });
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should fail to delete an AdminDB entity', async () => {
    const adminDBTest = new AdminDB({
      DB: adminFile.DB,
      ID: ONE,
      name: ADMIN_NAME,
    });

    let error;
    try {
      await adminDBTest.delete();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should delete a DB entity', async () => {
    const DBTest = new DB({
      DB: adminFile.DB,
      ID: 2,
    });

    await DBTest.delete();

    const entity = await adminFile.DB.manager.findOneBy(DBEntity, {
      ID: 2,
    });
    assert.ok(!entity);
  });
});