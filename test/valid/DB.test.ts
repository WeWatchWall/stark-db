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
    const db = new DB({ admins: [1], users: [2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Admin, db));
  });

  it('should pass user is admin in DB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [1], users: [2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Use, db));
  });
  
  it('should pass user is admin in admin DB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new AdminDB({ admins: [1], users: [2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Use, db));
  });

  it('should pass user logged in DB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], users: [1, 2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(true, ability.can(DBOp.Use, db));
  });

  it('should fail if not logged in', () => {
    const user = { ID: 1, isLoggedIn: false };
    const adminDB = new AdminDB({ admins: [1] });
    const userDB = new DB({ admins: [1], users: [1, 2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Admin, adminDB));
    assert.strictEqual(false, ability.can(DBOp.Admin, userDB));
    assert.strictEqual(false, ability.can(DBOp.Use, userDB));
  });

  it('should fail if user is not admin of AdminDB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const adminDB = new AdminDB({ admins: [2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Admin, adminDB));
  });

  it('should fail if user is not admin of DB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const adminDB = new DB({ admins: [2, 3], users: [1] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Admin, adminDB));
  });

  it('should fail user is not in DB', () => {
    const user = { ID: 1, isLoggedIn: true };
    const db = new DB({ admins: [], users: [2, 3] });

    const ability = defineAbilityForDB(user);

    assert.strictEqual(false, ability.can(DBOp.Use, db));
  });
});