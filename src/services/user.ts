import { ForbiddenError } from "@casl/ability";

import { User as UserEntity } from "../entities/user";
import { AdminDB } from "../objects/DB";
import { UserArg, User as UserObject } from "../objects/user";
import { CRUD } from "../utils/CRUD";
import { DBOp } from "../utils/DBOp";
import defineAbilityForDB from "../valid/DB";
import defineAbilityForUser from "../valid/user";
import assert from "assert";
import { ADMIN_NAME, ONE } from "../utils/constants";

export class User {
  adminDB: AdminDB;

  constructor(adminDB: AdminDB) {
    this.adminDB = adminDB;
  }

  async add(arg: {session: UserObject, arg: UserArg}): Promise<UserObject> {
    ForbiddenError
      .from(defineAbilityForDB(arg.session))
      .throwUnlessCan(DBOp.Admin, this.adminDB);
    
    const user = new UserObject({ DB: this.adminDB.DB });
    await user.save(arg.arg);

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

    await user.save(arg.arg);

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

    await user.delete();
  }

  private async isAdmin(user: UserObject): Promise<boolean> {
    await this.adminDB.load();
    return defineAbilityForDB(user).can(DBOp.Admin, this.adminDB);
  }
}