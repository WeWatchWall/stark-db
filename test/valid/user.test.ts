import assert from 'node:assert';
import { describe, it } from 'node:test';
import defineAbilityForUser from '../../src/valid/user';
import { User } from './entities';
import { CRUD } from '../../src/utils/CRUD';

describe('User Validation', () => {
  it('should pass if admin', () => {
    const user = { ID: 1 };
    const ability = defineAbilityForUser(user, true);

    const user2 = new User({ ID: 2 });

    assert.strictEqual(true, ability.can(CRUD.Create, user2));
    assert.strictEqual(true, ability.can(CRUD.Read, user2));
    assert.strictEqual(true, ability.can(CRUD.Update, user2));
    assert.strictEqual(true, ability.can(CRUD.Delete, user2));
  });

  it('should pass if user reads own user', () => {
    const user = { ID: 1 };
    const ability = defineAbilityForUser(user, false);

    const user2 = new User({ ID: 1 });

    assert.strictEqual(true, ability.can(CRUD.Read, user2));
  });

  it('should pass if user changes own user', () => {
    const user = { ID: 1 };
    const ability = defineAbilityForUser(user, false);

    const user2 = new User({ ID: 1 });

    assert.strictEqual(true, ability.can(CRUD.Update, user2));
    assert.strictEqual(true, ability.can(CRUD.Delete, user2));
  });

  it('should fail if user creates user', () => {
    const user = { ID: 1 };
    const ability = defineAbilityForUser(user, false);

    const user2 = new User({ ID: 2 });

    assert.strictEqual(false, ability.can(CRUD.Create, user2));
  });
  
  it('should fail if user reads other user', () => {
    const user = { ID: 1 };
    const ability = defineAbilityForUser(user, false);

    const user2 = new User({ ID: 2 });

    assert.strictEqual(false, ability.can(CRUD.Read, user2));
  });

  it('should fail if user changes other user', () => {
    const user = { ID: 1 };
    const ability = defineAbilityForUser(user, false);

    const user2 = new User({ ID: 2 });

    assert.strictEqual(false, ability.can(CRUD.Update, user2));
    assert.strictEqual(false, ability.can(CRUD.Delete, user2));
  });
});