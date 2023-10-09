// import { rmSync } from 'fs';
// import assert from 'node:assert';
// import { before, describe, it } from 'node:test';

// import { DB as DBEntity } from '../../src/entities/DB';
// import { User as UserEntity } from '../../src/entities/user';
// import { AdminDB, DB } from '../../src/objects/DB';
// import {
//   ADMIN_DB_NAME,
//   DB_IDENTIFIER,
//   DB_IDENTIFIER_ADMIN,
//   ONE
// } from '../../src/utils/constants';
// import { Variable } from '../../src/entities/variable';

// const USER_DB_NAME = 'userDB';

// describe('DB Objects', () => {
//   before(() => {
//     rmSync(DATA_DIR, { force: true, recursive: true });
//   });

//   it('should create an Admin DB', async () => {
//     await using adminDB = new AdminDB({
//       name: ADMIN_DB_NAME,
//       types: [DBEntity, UserEntity]
//     });
//     await adminDB.init();

//     const result = await adminDB.conn.query(`PRAGMA user_version;`);
//     assert.strictEqual(result[0].user_version, DB_IDENTIFIER_ADMIN);
//   });
  
//   it('should find an Admin DB', async () => {
//     await using adminDB = new AdminDB({
//       name: ADMIN_DB_NAME,
//       types: [DBEntity, UserEntity]
//     });
//     await adminDB.init();

//     assert.ok(adminDB.entity);
//     assert.strictEqual(ONE, adminDB.entity.id);
//   });

//   it('should create a DB', async () => {
//     await using db = new DB({
//       name: USER_DB_NAME,
//       entity: new DBEntity({ name: USER_DB_NAME, admins: [ONE], users: []}),
//       types: [Variable]
//     });
//     await db.init();

//     const result = await db.conn.query(`PRAGMA user_version;`);
//     assert.strictEqual(result[0].user_version, DB_IDENTIFIER);
//   });

//   it('should find a DB', async () => {
//     await using db = new DB({
//       name: USER_DB_NAME,
//       entity: new DBEntity({ name: USER_DB_NAME, admins: [ONE], users: []}),
//       types: [Variable]
//     });
//     await db.init();

//     assert.ok(db.conn);
//     assert.ok(db.conn.isInitialized);
//     assert.ok(db.entity);
//   });
// });