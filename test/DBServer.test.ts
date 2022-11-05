import { expect } from 'chai';

import { AdminDB } from '../src/server/DBAdmin';

describe('Server DB.', function () {
  this.timeout(600e3);

  it(`Hello world.`, async () => {
    const adminDB = new AdminDB({
      name: 'test.db',
      path: './test'
    });

    await adminDB.validator.readyAsync();

    expect(true).to.be.equal(true);
  });
});