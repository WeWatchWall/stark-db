import { ArrayModel, ObjectModel } from "objectmodel";
import { DataSource } from "typeorm";

import { DB as DBEntity } from "../entities/DB";
import { ADMIN_NAME, ONE } from "../utils/constants";
import { LazyValidator } from "../utils/lazyValidator";

export class DBArg {
  DB?: DataSource;

  ID?: number;
  name?: string;
  admins?: number[];
  users?: number[];
}

export abstract class DBBase {
  protected validator: LazyValidator;

  DB: DataSource;

  ID: number;
  name: string;
  admins: number[];
  users: number[];

  constructor(init: DBArg) {
    this.validator = new LazyValidator(
      () => this.validateInit.apply(this, []),
      () => this.readyInit.apply(this, [])
    );

    if (init != undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }
  private validateInit(): void { new DBInit(this); }
  private readyInit(): void { } // NOOP

  async load(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateLoad.apply(this, []),
      () => this.readyLoad.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  protected abstract validateLoad(): void;
  protected async readyLoad(): Promise<void> {
    const entity = await this.DB.manager.findOneByOrFail(DBEntity, {
      ID: this.ID,
      name: this.name,
    });
    Object.assign(this, entity);
  };

  async save(arg: DBArg): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateSave.apply(this, [arg]),
      () => this.readySave.apply(this, [arg])
    );

    await this.validator.readyAsync();
  }
  protected abstract validateSave(arg: DBArg): void;
  protected async readySave(arg: DBArg): Promise<void> {
    const adminsSet = new Set(arg.admins);
    const usersSet = new Set(arg.users);
    arg.admins = Array.from(adminsSet);
    arg.users = Array.from(usersSet);

    const entity = await this.DB.manager.save(DBEntity, arg);
    
    Object.assign(this, entity);
  };

  abstract delete(): Promise<void>;

  toObject(): DBArg {
    const { ID, name, admins, users } = this;
    return { ID, name, admins, users };
  }
}

const DBInit = new ObjectModel({
  DB: DataSource,
});

export class DB extends DBBase {
  protected validateLoad(): void {
    new DBLoad(this);
  }

  protected validateSave(arg: DBArg): void {
    new DBSave(arg);
  }

  async delete(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateDelete.apply(this, []),
      () => this.readyDelete.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  protected validateDelete(): void {
    new DBLoad(this);
  }
  protected async readyDelete(): Promise<void> {
    const arg = {
      ID: this.ID,
      name: this.name,
    };

    if (!this.ID) { delete arg.ID; }
    if (!this.name) { delete arg.name; }

    await this.DB.manager.delete(DBEntity, arg);
  }
}

// TODO: Check if either ID or name is defined.
// TODO: Check that ID is not ONE and name is not ADMIN_DB_NAME.
const DBLoad = new ObjectModel({
  ID: [Number],
  name: [String],
});

// TODO: Check that ID is not ONE and name is not ADMIN_DB_NAME.
const DBSave = new ObjectModel({
  ID: [Number],
  name: String,
  admins: ArrayModel(Number),
  users: ArrayModel(Number),
});

export class AdminDB extends DBBase {
  protected validateLoad(): void {
    new AdminDBLoad(this);
  }

  protected validateSave(arg: DBArg): void {
    new AdminDBSave(arg);
  }

  async delete(): Promise<void> {
    throw new Error("Security error: cannot delete the admin database.");
  }
}

const AdminDBLoad = new ObjectModel({
  ID: ONE,
  name: ADMIN_NAME,
});

const AdminDBSave = new ObjectModel({
  ID: ONE,
  name: ADMIN_NAME,
  admins: ArrayModel(Number),
  users: ArrayModel(Number),
});