import { expect } from 'chai';
import { existsSync, rmSync } from 'fs';
import { resolve } from 'path';

import { StarkVariable } from '../../src/entity/variable';
import { UserDB } from '../../src/server/objects/DBUser';

const DB_PATH = `./test`;
const DB_FILE = 'test.db';

describe('User DB.', function () {
  // this.timeout(600e3);

  this.beforeAll(async () => {
    const DBPath = resolve(DB_PATH, DB_FILE);
    // Delete the database file if it exists.
    if (existsSync(DBPath)) {
      rmSync(DBPath);
    }

    // Set the number of variables that are created.
    global.numVars = 0;
  });

  it(`Inits DB.`, async () => {
    const userDB = new UserDB({
      name: DB_FILE,
      path: DB_PATH,
      entities: [StarkVariable]
    });

    await userDB.validator.readyAsync();

    const vars = await userDB
      .DB
      .manager
      .find(StarkVariable);
    
    expect(vars.length).to.be.greaterThan(1);
    global.numVars = vars.length;
  });

  it(`Avoids double initialization.`, async () => {
    const userDB = new UserDB({
      name: DB_FILE,
      path: DB_PATH,
      entities: [StarkVariable]
    });

    await userDB.validator.readyAsync();

    const vars = await userDB
      .DB
      .manager
      .find(StarkVariable);
    
    expect(vars.length).to.be.equal(global.numVars);
  });
});