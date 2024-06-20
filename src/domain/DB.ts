import { ArrayModel, ObjectModel } from "objectmodel";
import { DataSource, MoreThan } from "typeorm";

import { ADMIN_NAME, ONE, ZERO } from "../utils/constants";
import { LazyValidator } from "../utils/lazyValidator";
import { DB as DBEntity } from "./entities/DB";
import { DBEvent, DBEventArg } from "./entities/DBEvent";
import { EventType } from "./entities/eventType";

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
    
    const events = await this.DB.manager.find(DBEvent, {
      where: {
        ID: this.ID,
        version: MoreThan(this.version),
      },
      order: { version: "ASC" },
    });

    for (const event of events) {
      this.applyEvent(event);
    }
  }

  private applyEvent(event: DBEvent): void {
    if (event.type === EventType.del) {
      return;
    }

    for (const [key, value] of Object.entries(event)) {
      if (key === "type") { continue; }
      if (value === undefined || value === null) { continue; }
      
      (this as any)[key] = value;
    }
  }

  async change(arg: DBEventArg): Promise<void> {
    switch (arg.type) {
      case "add":
        this.validator = new LazyValidator(
          () => this.validateChangeAdd.apply(this, [arg]),
          () => this.readyChangeAdd.apply(this, [arg])
        );
        break;
      case "set":
        this.validator = new LazyValidator(
          () => this.validateChangeSet.apply(this, [arg]),
          () => this.readyChangeSet.apply(this, [arg])
        );
        break;
      case "del":
        this.validator = new LazyValidator(
          () => this.validateChangeDel.apply(this, [arg]),
          () => this.readyChangeDel.apply(this, [arg])
        );
          break;
      default:
        break;
    }

    await this.validator.readyAsync();
  }

  protected abstract validateChangeAdd(arg: DBEventArg): void;
  protected async readyChangeAdd(arg: DBEventArg): Promise<void> {
    // Make each array property unique.
    arg.admins = Array.from(new Set(arg.admins));
    arg.readers = Array.from(new Set(arg.readers));
    arg.writers = Array.from(new Set(arg.writers));

    this.version = ZERO;
    const event = new DBEvent(arg);
    this.applyEvent(event);
    
    await this.save();

    event.ID = this.ID;
    await this.DB.manager.save(event);

    this.applyEvent(event);
  }

  protected abstract validateChangeSet(arg: DBEventArg): void;
  protected async readyChangeSet(arg: DBEventArg): Promise<void> {
    // Make each array property unique.
    arg.admins = Array.from(new Set(arg.admins));
    arg.readers = Array.from(new Set(arg.readers));
    arg.writers = Array.from(new Set(arg.writers));

    const event = new DBEvent(arg);
    await this.DB.manager.save(event);

    this.applyEvent(event);
  }

  protected abstract validateChangeDel(arg: DBEventArg): void;
  protected async readyChangeDel(arg: DBEventArg): Promise<void> {
    // Get the DBEntity to delete.
    const entity = await this.DB.manager.findOneOrFail(DBEntity, {
      where: {
        ID: arg.ID,
        name: arg.name,
      },
    });
    
    // Delete the DBEntity.
    await this.DB.manager.delete(DBEntity, {
      ID: entity.ID,
    });

    // Delete the related DBEvents.
    await this.DB.manager.delete(DBEvent, {
      ID: entity.ID,
    });
  }

  async save(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateSave.apply(this, []),
      () => this.readySave.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  protected abstract validateSave(): void;
  protected async readySave(): Promise<void> {
    const entity = await this.DB.manager.save(DBEntity, this.toObject());
    Object.assign(this, entity);
  };

  toObject(): DBArg {
    const { ID, name, admins, readers, writers, version } = this;
    return { ID, name, admins, readers, writers, version };
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

  protected validateSave(): void {
    new DBSave(this);
  }

  protected validateChangeAdd(arg: DBEventArg): void {
    new DBChangeAdd(arg);
  }
  protected validateChangeSet(arg: DBEventArg): void {
    new DBChangeSet(arg);
  }
  protected validateChangeDel(arg: DBEventArg): void {
    new DBChangeDelete(arg);
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

const DBChangeAdd = new ObjectModel({
  ID: undefined,
  name: String,
  admins: ArrayModel(Number),
  readers: ArrayModel(Number),
  writers: ArrayModel(Number),

  version: undefined,
});

const DBChangeSet = new ObjectModel({
  ID: Number,
  name: [String],
  admins: [ArrayModel(Number)],
  readers: [ArrayModel(Number)],
  writers: [ArrayModel(Number)],

  version: undefined,
});

const DBChangeDelete = new ObjectModel({
  ID: [Number],
  name: [String],

  version: undefined,
});
/* #endregion */

/* #region AdminDB */
export class AdminDB extends DBBase {
  protected validateLoad(): void {
    new AdminDBLoad(this);
  }

  protected validateSave(): void {
    new AdminDBSave(this);
  }

  protected validateChangeAdd(arg: DBEventArg): void {
    new AdminDBChangeAdd(arg);
  }
  protected validateChangeSet(arg: DBEventArg): void {
    new AdminDBChangeSet(arg);
  }
  protected validateChangeDel(arg: DBEventArg): void {
    new AdminDBChangeDelete(arg);
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

const AdminDBChangeAdd = new ObjectModel({
  ID: ONE,
  name: ADMIN_NAME,
  admins: ArrayModel(Number),
  readers: ArrayModel(Number),
  writers: ArrayModel(Number),

  version: undefined,
});

const AdminDBChangeSet = new ObjectModel({
  ID: ONE,
  name: ADMIN_NAME,
  admins: [ArrayModel(Number)],
  readers: [ArrayModel(Number)],
  writers: [ArrayModel(Number)],

  version: undefined,
});

const AdminDBChangeDelete = new ObjectModel({
  ID: ONE,
  name: ADMIN_NAME,

  version: undefined,
});
/* #endregion */