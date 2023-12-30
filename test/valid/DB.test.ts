import assert from 'node:assert';
import { describe, it } from 'node:test';
import defineAbilityForDB from '../../src/valid/DB';
import { AdminDB, DB } from './entities';
import { DBOp } from '../../src/utils/DBOp';

describe('DB Validation', () => {
  it('should pass admin logged in AdminDB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const adminDB = new AdminDB({ admins: [1] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Admin, adminDB));
  });

  it('should pass DB admin logged in DB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [1], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Admin, db));
  });

  it('should pass user is admin in DB and reads', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [1], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Read, db));
  });

  it('should pass user is admin in DB and writes', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [1], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Write, db));
  });

  it('should pass user is admin in admin DB and reads', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new AdminDB({ admins: [1], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Read, db));
  });

  it('should pass user is admin in admin DB and writes', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new AdminDB({ admins: [1], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Write, db));
  });

  it('should pass reader logged in DB and reads', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], readers: [1, 2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Read, db));
  });

  it('should pass writer logged in DB and reads', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], readers: [2, 3], writers: [1] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Read, db));
  });

  it('should pass writer logged in DB and writes', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], readers: [2, 3], writers: [1] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Write, db));
  });

  it('should fail if not logged in', () => {
    const user = { ID: 1, isLoggedIn: false };
    const adminDB = new AdminDB({ admins: [1] });
    const userDB = new DB({ admins: [1], readers: [1, 2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Admin, adminDB));
    assert.strictEqual(false, ability.can(DBOp.Admin, userDB));
    assert.strictEqual(false, ability.can(DBOp.Read, userDB));
  });

  it('should fail if user is not admin of AdminDB and admins', () => {
    const user = { ID: 1, isLoggedIn: true };
    const adminDB = new AdminDB({ admins: [2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Admin, adminDB));
  });

  it('should fail if user is not admin of DB and admins', () => {
    const user = { ID: 1, isLoggedIn: true };
    const adminDB = new DB({ admins: [2, 3], readers: [1], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Admin, adminDB));
  });

  it('should fail reader is not in DB and reads', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Read, db));
  });

  it('should fail writer is not in DB and writes', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], readers: [2, 3], writers: [4] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Write, db));
  });

  it('should fail user is not in writers and writes', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], readers: [1, 2], writers: [3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Write, db));
  });
});