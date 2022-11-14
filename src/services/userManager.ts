import { ObjectModel } from 'objectmodel';

import { User, UserArg } from '../entity/user';
import { IAdminDB } from '../objects/IDB';
import { ADMIN_USER } from '../utils/constants';
import { LazyValidator } from '../utils/lazyValidator';
import { IService } from './IService';

class UserManagerArg {
  DB: IAdminDB
}

export class UserManager implements IService {
  static adminDB: IAdminDB;

  /**
   * Inits a database manager.
   * @template T The type of AdminDB. Options: browser or server.
   * @param [init] The 
   * @returns init 
   */
  static async init(init: UserManagerArg): Promise<UserManager> {
    const result = new UserManager(init);

    await result.ready();

    return result;
  }

  validator: LazyValidator;
  private DB: IAdminDB;

  constructor(init?: UserManagerArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }

  protected validate(): void {
    new UserManagerInit(this);
  }

  protected async ready() {
    if (UserManager.adminDB != undefined) { return; }

    await this.DB.validator.readyAsync();
    UserManager.adminDB = this.DB;
  }

  async add(arg: UserArg): Promise<User> {
    if (arg.id != undefined || arg.userName === ADMIN_USER) {
      return undefined;
    }

    // Add the user to the admin DB.
    const user = new User(arg);
    await UserManager.adminDB.DB.manager.save(user);

    return user;
  }

  async set(arg: UserArg): Promise<User> {
    if (
      arg.id == undefined ||
      arg.id === 1 ||
      arg.userName === ADMIN_USER
    ) {
      return undefined;
    }

    // Check if the user already exists.
    let user = await UserManager
      .adminDB
      .DB
      .manager
      .findOneBy(User, {
        id: arg.id,
      });

    if (user == undefined) { return user; }

    // Update the user in the admin DB.
    user = new User(arg);
    await UserManager.adminDB.DB.manager.save(user);

    return user;
  }

  async get(arg: UserArg): Promise<User> {
    if (arg.id == undefined && arg.userName == undefined) {
      return undefined;
    }

    return UserManager
      .adminDB
      .DB
      .manager
      .findOneBy(User, arg);
  }

  async del(arg: UserArg): Promise<User> {
    if (
      (arg.id == undefined && arg.userName == undefined) ||
      arg.id === 1 ||
      arg.userName === ADMIN_USER
    ) {
      return undefined;
    }

    // Check if the user already exists.
    let user = await UserManager
      .adminDB
      .DB
      .manager
      .findOneBy(User, arg);
    
    if (user == undefined) { return user; }

    // Delete the user from the admin DB.
    await UserManager.adminDB.DB.manager.delete(User, user);

    return user;
  }

  async destroy(): Promise<void> {
    if (UserManager.adminDB == undefined) { return; }

    await UserManager.adminDB.destroy();
    delete UserManager.adminDB;
  }
}

const UserManagerInit = new ObjectModel({
});