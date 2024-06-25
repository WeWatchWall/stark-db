import { ForbiddenError } from "@casl/ability";

import { User as UserEntity } from "../entities/user";
import { AdminDB } from "../domain/DB";
import { UserArg, User as UserObject } from "../domain/user";
import { CRUD } from "../utils/CRUD";
import { DBOp } from "../utils/DBOp";
import defineAbilityForDB from "../valid/DB";
import defineAbilityForUser from "../valid/user";
import assert from "assert";
import { ADMIN_NAME, DOMAIN_EVENT_PERSIST, ONE, ZERO } from "../utils/constants";
import { EventType } from "../entities/eventType";
import { setTimeout } from "timers/promises";

export class User {
  adminDB: AdminDB;
  private isPrimary: boolean;

  constructor(adminDB: AdminDB, isPrimary: boolean) {
    this.adminDB = adminDB;
    this.isPrimary = isPrimary;
  }

  async init(): Promise<void> {
    if (!this.isPrimary) { return; }

    void this.updateEntities();
  }

  
  async updateEntities(): Promise<void> {
    while (true) {
      const localUserEntities = await this.adminDB.DB.manager.find(UserEntity);
      for (const localUserEntity of localUserEntities) {
        const localUserObject = new UserObject({
          DB: this.adminDB.DB,
          ID: localUserEntity.ID
        });
        await localUserObject.load();
        await localUserObject.save();
      }

      await setTimeout(DOMAIN_EVENT_PERSIST);
    }
  }

  async add(arg: {session: UserObject, arg: UserArg}): Promise<UserObject> {
    ForbiddenError
      .from(defineAbilityForDB(arg.session))
      .throwUnlessCan(DBOp.Admin, this.adminDB);
    
    const user = new UserObject({ DB: this.adminDB.DB });
    await user.change({type: EventType.add, ...arg.arg});

    return user;
  }

  async get(arg: {session: UserObject, arg: UserArg}): Promise<UserObject> {
    // TODO: make redundant.
    assert.ok(arg.arg.ID || arg.arg.name);
  
    const user = new UserObject({ DB: this.adminDB.DB, ...arg.arg });
    await user.load();

    const isAdmin = await this.isAdmin(arg.session);
    ForbiddenError
      .from(defineAbilityForUser(arg.session, isAdmin))
      .throwUnlessCan(CRUD.Read, user);

    return user;
  }

  async getAll(sessionUser: UserObject): Promise<UserObject[]> {
    await this.adminDB.load();
    
    ForbiddenError
      .from(defineAbilityForDB(sessionUser))
      .throwUnlessCan(DBOp.Admin, this.adminDB);
    
    const users: UserObject[] = [];
    const entities = await this.adminDB.DB.manager.find(UserEntity);
    for (const entity of entities) {
      const user = new UserObject({ DB: this.adminDB.DB, ...entity });
      users.push(user);
    }

    return users;
  }

  async set(
    arg: { session: UserObject, arg: UserArg }
  ): Promise<UserObject> {
    const isAdmin = await this.isAdmin(arg.session);
    
    const user = new UserObject({ DB: this.adminDB.DB, ID: arg.arg.ID });
    await user.load();

    ForbiddenError
      .from(defineAbilityForUser(arg.session, isAdmin))
      .throwUnlessCan(CRUD.Update, user);

    await user.change({ type: EventType.set, ...arg.arg });

    return user;
  }

  async del(
    arg: { session: UserObject, arg: UserArg }
  ): Promise<void> {
    // TODO: make redundant.
    assert.ok(arg.arg.ID || arg.arg.name);
    assert.ok(arg.arg.ID !== ONE && arg.arg.name !== ADMIN_NAME);

    const user = new UserObject({ DB: this.adminDB.DB, ...arg.arg });
    await user.load();

    const isAdmin = await this.isAdmin(arg.session);
    ForbiddenError
      .from(defineAbilityForUser(arg.session, isAdmin))
      .throwUnlessCan(CRUD.Delete, user);

    await user.change({ type: EventType.del, ...arg.arg });
  }

  private async isAdmin(user: UserObject): Promise<boolean> {
    await this.adminDB.load();
    return defineAbilityForDB(user).can(DBOp.Admin, this.adminDB);
  }
}