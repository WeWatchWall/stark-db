import { ForbiddenError } from "@casl/ability";
import retry from 'async-retry';
import assert from "node:assert";

import { AdminDB, DBArg, DBBase, DB as DBObject } from "../domain/DB";
import { AdminDBFile, DBFile } from "../domain/DBFile";
import { DB as DBEntity } from "../domain/entities/DB";
import { DBEvent as DBEventEntity } from "../domain/entities/DBEvent";
import { EventType } from "../domain/entities/eventType";
import { User as UserEntity } from "../domain/entities/user";
import { UserEvent as UserEventEntity } from "../domain/entities/userEvent";
import { Variable as VariableEntity } from "../domain/entities/variable";
import { User } from "../domain/user";
import { Variable } from "../domain/variable";
import { DBOp } from "../utils/DBOp";
import { ADMIN_NAME, DB_EXISTS_CHECK, ONE, ZERO } from "../utils/constants";
import { Variable as VariableType } from '../utils/variable';
import defineAbilityForDB from "../valid/DB";

export class DB implements AsyncDisposable {
  adminDB: AdminDB;
  private adminDBFile: AdminDBFile;

  constructor() {
    this.adminDBFile = new AdminDBFile({
      name: ADMIN_NAME,
      types: [
        VariableEntity,
        DBEntity,
        DBEventEntity,
        UserEntity,
        UserEventEntity
      ]
    });
  }

  async init(): Promise<void> {
    await this.adminDBFile.load();
    this.adminDB = new AdminDB({
      DB: this.adminDBFile.DB,
      ID: ONE,
      name: ADMIN_NAME
    });

    if (await this.adminDBFile.isInit()) { await this.adminDB.load(); return; }

    // Initialize the AdminDB.
    await this.adminDB.change({
      type: EventType.add,

      ID: ONE,
      name: ADMIN_NAME,
      admins: [ONE],
      readers: [],
      writers: []
    });
    assert.strictEqual(this.adminDB.ID, ONE);

    // Initialize the Admin user.
    const adminUser = new User({ DB: this.adminDBFile.DB });
    await adminUser.change({
      type: EventType.add,

      ID: ONE,
      name: ADMIN_NAME,
      password: ADMIN_NAME,
      salt: ''
    });
    assert.strictEqual(adminUser.ID, ONE);

    // Initialize the AdminDBFile.
    await this.adminDBFile.setInit();
  }

  async add(arg: { user: User, DB: DBArg }): Promise<DBObject> {
    ForbiddenError
      .from(defineAbilityForDB(arg.user))
      .throwUnlessCan(DBOp.Admin, this.adminDB);

    assert.strictEqual(arg.DB.ID, undefined);

    await using localDBFile =
      new DBFile({ name: arg.DB.name, types: [VariableEntity] });
    await localDBFile.load();

    // Save the auxiliary variables.
    const version = new Variable({ DB: localDBFile.DB });
    await version.save({ name: VariableType.version, value: ZERO });

    // Set the initialized flag.
    await localDBFile.setInit();

    // reload the AdminDB in case of changes.
    await this.adminDB.load();

    const localDBObject = new DBObject({ DB: this.adminDBFile.DB });
    await localDBObject.change({
      type: EventType.add,

      name: arg.DB.name,
      admins: arg.DB.admins.concat(arg.user.ID, this.adminDB.admins),
      readers: arg.DB.readers,
      writers: arg.DB.writers
    });

    return localDBObject;
  }

  async get(arg: { user: User, DB: DBArg }): Promise<DBBase> {
    // TODO: make redundant.
    assert.ok(arg.DB.ID || arg.DB.name);

    let localDB: DBBase = new DBObject({
      DB: this.adminDBFile.DB,
      ID: arg.DB.ID,
      name: arg.DB.name
    });

    await localDB.load();
    if (localDB.ID === ONE) {
      localDB = new AdminDB(localDB);
    }

    ForbiddenError
      .from(defineAbilityForDB(arg.user))
      .throwUnlessCan(DBOp.Read, localDB);

    return localDB;
  }

  async getAll(arg: { user: User, DB: DBArg }): Promise<DBBase[]> {
    if (arg.DB.ID || arg.DB.name) { return [await this.get(arg)]; }

    const localDBs: DBBase[] = [];

    // Get all the DBs.
    const localDBEntities = await this.adminDB.DB.manager.find(DBEntity);
    for (const localDBEntity of localDBEntities) {
      let localDB: DBBase;

      try {
        localDB = await this.get({ user: arg.user, DB: localDBEntity });
        localDBs.push(localDB);
      } catch (error) { continue; } // Expected forbidden error for some DBs.
    }

    return localDBs;
  }

  async set(arg: { user: User, DB: DBArg }): Promise<DBBase> {
    const localDB = await this.get({
      user: arg.user,
      DB: { ID: arg.DB.ID }
    });

    ForbiddenError
      .from(defineAbilityForDB(arg.user))
      .throwUnlessCan(DBOp.Admin, localDB);

    const previousName = localDB.name;

    // Update the DB entry.
    await localDB.change({ type: EventType.set, ...arg.DB });

    // Initialize the DB file object.
    const localDBFile = new DBFile({
      name: previousName,
      types: []
    });

    // Retry updating the file until it succeeds.
    await retry(
      async (_bail) => {
        await localDBFile.save({ name: arg.DB.name, types: [] });
      },
      {
        retries: 3,
        minTimeout: DB_EXISTS_CHECK
      }
    );

    return localDB;
  }

  async del(arg: { user: User, DB: DBArg }): Promise<void> {
    assert.ok(arg.DB.ID !== ONE && arg.DB.name !== ADMIN_NAME);

    const localDB = await this.get(arg);
    ForbiddenError
      .from(defineAbilityForDB(arg.user))
      .throwUnlessCan(DBOp.Admin, localDB);

    // Delete the DB entry.
    await localDB.change({
      type: EventType.del,
      ID: localDB.ID
    });

    // Initialize the DB file object.
    const localDBFile = new DBFile({
      name: localDB.name,
      types: []
    });

    // Retry deleting the file until it succeeds.
    await retry(
      async (_bail) => {
        await localDBFile.delete();
      },
      {
        retries: 3,
        minTimeout: DB_EXISTS_CHECK
      }
    );
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.adminDBFile[Symbol.asyncDispose]();
  }
}