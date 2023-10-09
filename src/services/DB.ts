import { ForbiddenError } from "@casl/ability";
import assert from "node:assert";

import { DB as DBEntity } from "../entities/DB";
import { User as UserEntity } from "../entities/user";
import { Variable as VariableEntity } from "../entities/variable";
import { AdminDB, DBArg, DBBase, DB as DBObject } from "../objects/DB";
import { AdminDBFile, DBFile } from "../objects/DBFile";
import { User } from "../objects/user";
import { Variable } from "../objects/variable";
import { DBOp } from "../utils/DBOp";
import { ADMIN_NAME, ONE, ZERO } from "../utils/constants";
import { Variable as VariableType } from '../utils/variable';
import defineAbilityForDB from "../valid/DB";

export class DB implements AsyncDisposable {
  adminDB: AdminDB;
  private adminDBFile: AdminDBFile;

  constructor() {
    this.adminDBFile = new AdminDBFile({
      name: ADMIN_NAME,
      types: [DBEntity, UserEntity]
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
    await this.adminDB.save({
      ID: ONE,
      name: ADMIN_NAME,
      admins: [ONE],
      users: [],
    });
    assert.strictEqual(this.adminDB.ID, ONE);

    // Initialize the Admin user.
    const adminUser = new User({ DB: this.adminDBFile.DB });
    await adminUser.save({
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
    const isDiff = new Variable({ DB: localDBFile.DB });
    await isDiff.save({ name: VariableType.isDiff, value: true });
    const isMemory = new Variable({ DB: localDBFile.DB });
    await isMemory.save({ name: VariableType.isMemory, value: true });
    const isChanged = new Variable({ DB: localDBFile.DB });
    await isChanged.save({ name: VariableType.isChanged, value: false });
    const changeCount = new Variable({ DB: localDBFile.DB });
    await changeCount.save({ name: VariableType.changeCount, value: ZERO });

    // Set the initialized flag.
    await localDBFile.setInit();

    // reload the AdminDB in case of changes.
    await this.adminDB.load();

    const localDBObject = new DBObject({ DB: this.adminDBFile.DB });
    await localDBObject.save({
      name: arg.DB.name,
      admins: arg.DB.admins.concat(arg.user.ID, this.adminDB.admins),
      users: arg.DB.users,
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
      .throwUnlessCan(DBOp.Use, localDB);

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
    const localDB = await this.get(arg);

    ForbiddenError
      .from(defineAbilityForDB(arg.user))
      .throwUnlessCan(DBOp.Admin, localDB);

    const localDBFile = new DBFile({
      name: localDB.name,
      types: []
    });
    await localDBFile.save({ name: arg.DB.name, types: [] });

    await localDB.save(arg.DB);

    return localDB;
  }

  async del(arg: { user: User, DB: DBArg }): Promise<void> {
    assert.ok(arg.DB.ID !== ONE && arg.DB.name !== ADMIN_NAME);

    const localDB = await this.get(arg);
    ForbiddenError
      .from(defineAbilityForDB(arg.user))
      .throwUnlessCan(DBOp.Admin, localDB);

    const localDBFile = new DBFile({
      name: localDB.name,
      types: []
    });
    await localDBFile.delete();

    await localDB.delete();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.adminDBFile[Symbol.asyncDispose]();
  }
}