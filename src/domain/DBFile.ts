import { DataSource } from "typeorm";
import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import {
  ADMIN_NAME,
  DB_IDENTIFIER,
  DB_IDENTIFIER_ADMIN,
} from "../utils/constants";
import { DBDriverSwitch } from '../drivers/DBDriverSwitch';
import { Variable } from './variable';
import { Variable as VariableName } from "../utils/variable";

export class DBFileArg {
  name: string;
  types: any[];
}

export abstract class DBFileBase {
  name: string;
  types: any[];

  DB: DataSource;

  constructor(init: DBFileArg) {
    if (init != undefined) {
      Object.assign(this, init);
    }
  }

  async load(): Promise<void> {
    this.validateLoad();
    await this.readyLoad();
  }
  protected abstract validateLoad(): void;
  protected async readyLoad(): Promise<void> {
    await DBDriverSwitch.createDB(this.name);
    this.DB = await DBDriverSwitch.connect(this.name, this.types, true);
  }

  abstract save(arg: DBFileArg): Promise<void>;
  abstract delete(): Promise<void>;

  abstract isInit(): Promise<boolean>;
  abstract setInit(): Promise<void>;

  protected async isType(version: number): Promise<boolean> {
    const type = new Variable({ DB: this.DB, name: VariableName.type });
    try {
      await type.load();
    } catch {
      return false;
    }

    return type.value === version;
  }

  protected async setType(version: number): Promise<void> {
    await DBDriverSwitch.provision(this.DB);
    const type = new Variable({ DB: this.DB, name: VariableName.type });
    await type.save({ name: VariableName.type, value: version });
  }

  [Symbol.asyncDispose](): Promise<void> {
    if (!this.DB) { return Promise.resolve(undefined); }
    // ignore the error if the connection is already closed.
    return DBDriverSwitch.disconnect(this.DB).catch(() => undefined);
  }
}

export class DBFile extends DBFileBase {
  validateLoad(): void {
    new DBInit(this);
  }

  async save(arg: DBFileArg): Promise<void> {
    this.validateSave(arg);
    await this.readySave(arg);
  }
  protected validateSave(arg: DBFileArg): void {
    new DBInit(arg);
  }
  protected async readySave(arg: DBFileArg): Promise<void> {
    if (arg.name === this.name) { return; }

    // Check if the database is initialized. Connect to it first if necessary.
    if (!this.DB || !this.DB.isInitialized) {
      await this.load();
    }
    if (!await this.isInit()) {
      throw new Error(`Cannot rename the database ${this.name} because it is not initialized.`);
    }

    // Close the connection.
    await this.DB.destroy();    

    // Rename the file.
    await DBDriverSwitch.renameDB(this.name, arg.name);
    
    // Run the readyLoad function again.
    Object.assign(this, arg);
    await this.readyLoad();
  }

  async delete(): Promise<void> {
    this.validateDelete();
    await this.readyDelete();
  }
  protected validateDelete(): void { new DBInit(this); }
  protected async readyDelete(): Promise<void> {
    // Check if the database is initialized. Connect to it first if necessary.
    if (!this.DB || !this.DB.isInitialized) {
      await this.load();
    }

    if (!await this.isInit()) {
      throw new Error(`Cannot delete the database ${this.name} because it is not initialized.`);
    }

    // Close the connection.
    await this.DB.destroy();

    // Delete the file.
    await DBDriverSwitch.deleteDB(this.name);
  }

  async isInit(): Promise<boolean> {
    return await this.isType(DB_IDENTIFIER);
  }

  async setInit(): Promise<void> {
    await this.setType(DB_IDENTIFIER);
  }
}

const DBInit = new ObjectModel({
  name: String,
  types: ArrayModel(Any),
});

export class AdminDBFile extends DBFileBase {
  protected validateLoad(): void {
    new AdminDBLoadInit(this);
  }

  save(_arg: DBFileArg): Promise<void> {
    throw new Error("Security error: cannot rename the admin database.");
  }
  
  delete(): Promise<void> {
    throw new Error("Security error: cannot delete the admin database.");
  }

  async isInit(): Promise<boolean> {
    return await this.isType(DB_IDENTIFIER_ADMIN);
  }

  async setInit(): Promise<void> {
    await this.setType(DB_IDENTIFIER_ADMIN);
  }
}

const AdminDBLoadInit = new ObjectModel({
  name: ADMIN_NAME,
  // TODO: This type is actually a constructor: () => Any.
  types: ArrayModel(Any),
});