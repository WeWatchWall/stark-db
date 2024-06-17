import { ObjectModel } from "objectmodel";
import { DataSource } from "typeorm";

import { User as UserEntity } from "./entities/user";
import { LazyValidator } from "../utils/lazyValidator";
import { Password } from "../utils/password";

export class UserArg {
  DB?: DataSource;

  ID?: number;
  name?: string;
  password?: string;
  salt?: string;

  isLoggedIn?: boolean;
}

export class User {
  private validator: LazyValidator;

  DB: DataSource;

  ID: number;
  name: string;
  password: string;
  salt: string;

  isLoggedIn = false;

  constructor(init: UserArg) {
    this.validator = new LazyValidator(
      () => this.validateInit.apply(this, []),
      () => this.readyInit.apply(this, [])
    );

    if (init != undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }
  private validateInit(): void { new UserInit(this); }
  private readyInit(): void { } // NOOP

  login(password: string): void {

    const loginHash = Password.hash(password, this.salt);
    if (loginHash !== this.password) { return;}

    this.isLoggedIn = true;
  }
  logout(): void {
    this.isLoggedIn = false;
  }

  async load(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateLoad.apply(this, []),
      () => this.readyLoad.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  validateLoad(): void { new UserLoad(this); }
  async readyLoad(): Promise<void> {
    const entity = await this.DB.manager.findOneByOrFail(UserEntity, {
      ID: this.ID,
      name: this.name,
    });
    Object.assign(this, entity);
  }

  async save(arg: UserArg): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateSave.apply(this, [arg]),
      () => this.readySave.apply(this, [arg])
    );

    await this.validator.readyAsync();
  }
  validateSave(arg: UserArg): void { new UserSave(arg); }
  async readySave(arg: UserArg): Promise<void> {
    arg.salt = Password.getSalt();
    arg.password = Password.hash(arg.password, arg.salt);

    const entity = await this.DB.manager.save(UserEntity, arg);
    Object.assign(this, entity);
  }

  toObject(): UserArg {
    const { ID, name, password, salt, isLoggedIn } = this;
    return { ID, name, password, salt, isLoggedIn };
  }
}

const UserInit = new ObjectModel({
  DB: DataSource,
});

// TODO: Check if either ID or name is defined.
const UserLoad = new ObjectModel({
  ID: [Number],
  name: [String]
});

const UserSave = new ObjectModel({
  ID: [Number],
  name: String,
  password: String,
  salt: String,
});