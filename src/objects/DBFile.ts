import fs from 'fs';
import path from "path";
import { DataSource } from "typeorm";
import { Any, ArrayModel, ObjectModel } from 'objectmodel';

import {
  ADMIN_NAME,
  DB_DRIVER,
  DB_IDENTIFIER,
  DB_IDENTIFIER_ADMIN,
  DATA_DIR
} from "../utils/constants";
import { LazyValidator } from "../utils/lazyValidator";

const PRAGMA_VER = 'user_version';
const PRAGMA_WAL = 'journal_mode';

export class DBFileArg {
  name: string;
  types: any[];
}

export abstract class DBFileBase {
  protected validator: LazyValidator;

  name: string;
  fileName: string;
  types: any[];

  DB: DataSource;

  constructor(init: DBFileArg) {
    if (init != undefined) {
      Object.assign(this, init);
    }
  }

  async load(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateLoad.apply(this, []),
      () => this.readyLoad.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  protected abstract validateLoad(): void;
  protected async readyLoad(): Promise<void> {
    this.fileName = DBFileBase.getFileName(this.name);

    // Open the database.
    this.DB = new DataSource({
      type: DB_DRIVER,
      database: this.fileName,
      cache: true,
      synchronize: true, // TODO: remove this in production
      logging: false,
      entities: this.types,
    });

    await this.DB.initialize();
  }

  abstract save(arg: DBFileArg): Promise<void>;
  abstract delete(): Promise<void>;

  abstract isInit(): Promise<boolean>;
  abstract setInit(): Promise<void>;

  protected static getFileName(name: string): string {
    const dir = DATA_DIR;

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    return path.resolve(dir, `${name}.db`);
  }

  protected async isVersion(version: number): Promise<boolean> {
    const result = await this.DB.query(`PRAGMA ${PRAGMA_VER};`);

    return result[0][PRAGMA_VER] === version;
  }

  protected async setVersion(version: number): Promise<void> {
    await this.DB.query(`PRAGMA busy_timeout = 30000;`);
    await this.DB.query(`PRAGMA ${PRAGMA_WAL} = WAL;`);
    await this.DB.query(`PRAGMA ${PRAGMA_VER} = ${version};`);
  }

  [Symbol.asyncDispose](): Promise<void> {
    if (!this.DB) { return Promise.resolve(undefined); }
    // ignore the error if the connection is already closed.
    return this.DB.destroy().catch(() => undefined);
  }
}

export class DBFile extends DBFileBase {
  validateLoad(): void {
    new DBInit(this);
  }

  async save(arg: DBFileArg): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateSave.apply(this, [arg]),
      () => this.readySave.apply(this, [arg])
    );

    await this.validator.readyAsync();
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
    const newFileName = DBFileBase.getFileName(arg.name);
    fs.renameSync(this.fileName, newFileName);
    
    // Run the readyLoad function again.
    Object.assign(this, arg);
    await this.readyLoad();
  }

  async delete(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateDelete.apply(this, []),
      () => this.readyDelete.apply(this, [])
    );

    await this.validator.readyAsync();
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
    fs.rmSync(this.fileName);
    fs.rmSync(`${this.fileName}-shm`, { force: true });
    fs.rmSync(`${this.fileName}-wal`, { force: true });
  }

  async isInit(): Promise<boolean> {
    return await this.isVersion(DB_IDENTIFIER);
  }

  async setInit(): Promise<void> {
    await this.setVersion(DB_IDENTIFIER);
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
    return await this.isVersion(DB_IDENTIFIER_ADMIN);
  }

  async setInit(): Promise<void> {
    await this.setVersion(DB_IDENTIFIER_ADMIN);
  }
}

const AdminDBLoadInit = new ObjectModel({
  name: ADMIN_NAME,
  // TODO: This type is actually a constructor: () => Any.
  types: ArrayModel(Any),
});