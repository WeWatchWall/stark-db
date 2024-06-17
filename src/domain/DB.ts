import { ArrayModel, ObjectModel } from "objectmodel";
import { DataSource } from "typeorm";

import { ADMIN_NAME, ONE } from "../utils/constants";
import { LazyValidator } from "../utils/lazyValidator";
import { DB as DBEntity } from "./entities/DB";

export class DBArg {
  DB?: DataSource;

  ID?: number;
  name?: string;
  admins?: number[];
  readers?: number[];
  writers?: number[];

  version?: number;
}

/* #region DBBase */
export abstract class DBBase {
  protected validator: LazyValidator;

  DB: DataSource;

  ID: number;
  name: string;
  admins: number[];
  readers: number[];
  writers: number[];

  version: number;

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
    // Make each array property unique.
    arg.admins = Array.from(new Set(arg.admins));
    arg.readers = Array.from(new Set(arg.readers));
    arg.writers = Array.from(new Set(arg.writers));

    const entity = await this.DB.manager.save(DBEntity, arg);

    Object.assign(this, entity);
  };

  toObject(): DBArg {
    const { ID, name, admins, readers, writers } = this;
    return { ID, name, admins, readers, writers };
  }
}

const DBInit = new ObjectModel({
  DB: DataSource,
});
/* #endregion */

/* #region DB */
export class DB extends DBBase {
  protected validateLoad(): void {
    new DBLoad(this);
  }

  protected validateSave(arg: DBArg): void {
    new DBSave(arg);
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
  readers: ArrayModel(Number),
  writers: ArrayModel(Number),

  version: Number,
});
/* #endregion */

/* #region AdminDB */
export class AdminDB extends DBBase {
  protected validateLoad(): void {
    new AdminDBLoad(this);
  }

  protected validateSave(arg: DBArg): void {
    new AdminDBSave(arg);
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
  readers: ArrayModel(Number),
  writers: ArrayModel(Number),

  version: Number,
});
/* #endregion */