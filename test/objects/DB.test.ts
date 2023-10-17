import { existsSync, rmSync } from 'fs';
import assert from 'node:assert';
import { before, describe, it } from 'node:test';
import { ADMIN_NAME, DATA_DIR } from '../../src/utils/constants';
import { AdminDBFile, DBFile } from '../../src/objects/DBFile';
import path from 'node:path';

const USER_DB_NAME = 'userDB';
const USER_DB_NAME_2 = 'userDB2';

const ADMIN_DB_NAME_2 = 'adminDB2';

describe('DBFile Objects', () => {
  before(() => {
    rmSync(DATA_DIR, { force: true, recursive: true });
  });

  it('should create an Admin file', async () => {
    await using file = new AdminDBFile({ name: ADMIN_NAME, types: [] });
    await file.load();

    const filePath = path.resolve(DATA_DIR, `${ADMIN_NAME}.db`);
    assert.ok(existsSync(filePath));
    assert.ok(!await file.isInit());
  });

  it('should create a file', async () => {
    await using file = new DBFile({ name: USER_DB_NAME, types: [] });
    await file.load();

    const filePath = path.resolve(DATA_DIR, `${USER_DB_NAME}.db`);
    assert.ok(existsSync(filePath));
    assert.ok(!await file.isInit());
  });

  it('should fail to rename an admin file', async () => {
    await using file = new AdminDBFile({ name: ADMIN_NAME, types: [] });
    await file.load();

    let error;
    try {
      await file.save({ name: ADMIN_DB_NAME_2, types: [] });
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should fail to rename an unitialized file', async () => {
    await using file = new DBFile({ name: USER_DB_NAME, types: [] });
    await file.load();

    let error;
    try {
      await file.save({ name: USER_DB_NAME_2, types: [] });
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should initialize an admin file', async () => {
    await using file = new AdminDBFile({ name: ADMIN_NAME, types: [] });
    await file.load();

    await file.setInit();
    assert.ok(await file.isInit());
  });

  it('should initialize a file', async () => {
    await using file = new DBFile({ name: USER_DB_NAME, types: [] });
    await file.load();

    await file.setInit();
    assert.ok(await file.isInit());
  });

  it('should rename an initialized file', async () => {
    await using file = new DBFile({ name: USER_DB_NAME, types: [] });
    await file.load();

    await file.save({ name: USER_DB_NAME_2, types: [] });

    const filePath = path.resolve(DATA_DIR, `${USER_DB_NAME_2}.db`);
    assert.ok(existsSync(filePath));
    assert.ok(await file.isInit());
  });

  it('should fail to delete an admin file', async () => {
    await using file = new AdminDBFile({ name: ADMIN_NAME, types: [] });
    await file.load();

    let error;
    try {
      await file.delete();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should fail to delete an unitialized file', async () => {
    await using file = new DBFile({ name: USER_DB_NAME, types: [] });

    let error;
    try {
      await file.delete();
    } catch (err) {
      error = err;
    }
    assert.ok(error);
  });

  it('should delete an initialized file', async () => {
    await using file = new DBFile({ name: USER_DB_NAME, types: [] });
    await file.load();

    await file.setInit();
    assert.ok(await file.isInit());

    await file.delete();

    const filePath = path.resolve(DATA_DIR, `${USER_DB_NAME}.db`);
    assert.ok(!existsSync(filePath));
  });
});