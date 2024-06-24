import { ObjectModel } from "objectmodel";
import { DataSource, MoreThan } from "typeorm";

import { User as UserEntity } from "../entities/user";
import { LazyValidator } from "../utils/lazyValidator";
import { Password } from "../utils/password";
import { UserEvent, UserEventArg } from "../entities/userEvent";
import { EventType } from "../entities/eventType";
import { ZERO } from "../utils/constants";

export class UserArg {
  DB?: DataSource;

  ID?: number;
  name?: string;
  password?: string;
  salt?: string;

  isLoggedIn?: boolean;

  version?: number;
}

export class User {

  DB: DataSource;

  ID: number;
  name: string;
  password: string;
  salt: string;

  isLoggedIn = false;

  version: number;

  constructor(init: UserArg) {
    if (init != undefined) {
      Object.assign(this, init);
      this.validateInit();
      this.readyInit();
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
    this.validateLoad();
    await this.readyLoad();
  }
  private validateLoad(): void { new UserLoad(this); }
  private async readyLoad(): Promise<void> {
    const entity = await this.DB.manager.findOneByOrFail(UserEntity, {
      ID: this.ID,
      name: this.name,
    });
    Object.assign(this, entity);

    const events = await this.DB.manager.find(UserEvent, {
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

  private applyEvent(event: UserEvent): void {
    if (event.type === EventType.del) {
      return;
    }

    for (const [key, value] of Object.entries(event)) {
      if (key === "type") { continue; }
      if (value === undefined || value === null) { continue; }
      
      (this as any)[key] = value;
    }
  }

  
  async change(arg: UserEventArg): Promise<void> {
    switch (arg.type) {
      case "add":
        this.validateChangeAdd(arg);
        await this.readyChangeAdd(arg);
        break;
      case "set":
        this.validateChangeSet(arg);
        await this.readyChangeSet(arg);
        break;
      case "del":
        this.validateChangeDel(arg);
        await this.readyChangeDel(arg);
        break;
      default:
        break;
    }
  }

  private validateChangeAdd(arg: UserEventArg): void { new UserChangeAdd(arg); }
  private async readyChangeAdd(arg: UserEventArg): Promise<void> {
    // Make each array property unique.
    arg.salt = Password.getSalt();
    arg.password = Password.hash(arg.password, arg.salt);

    this.version = ZERO;
    const event = new UserEvent(arg);
    this.applyEvent(event);
    
    await this.save();

    event.ID = this.ID;
    await this.DB.manager.save(event);

    this.applyEvent(event);
  }

  private validateChangeSet(arg: UserEventArg): void { new UserChangeSet(arg); }
  protected async readyChangeSet(arg: UserEventArg): Promise<void> {
    // Make each array property unique.
    arg.salt = Password.getSalt();
    arg.password = Password.hash(arg.password, arg.salt);

    const event = new UserEvent(arg);
    await this.DB.manager.save(event);

    this.applyEvent(event);
  }

  private validateChangeDel(arg: UserEventArg): void { new UserChangeDel(arg); }
  protected async readyChangeDel(arg: UserEventArg): Promise<void> {
    // Get the UserEntity to delete.
    const entity = await this.DB.manager.findOneOrFail(UserEntity, {
      where: {
        ID: arg.ID,
        name: arg.name,
      },
    });
    
    // Delete the UserEntity.
    await this.DB.manager.delete(UserEntity, {
      ID: entity.ID,
    });

    // Delete the related UserEvents.
    await this.DB.manager.delete(UserEvent, {
      ID: entity.ID,
    });
  }

  async save(): Promise<void> {
    this.validateSave();
    await this.readySave();
  }
  private validateSave(): void { new UserSave(this); }
  private async readySave(): Promise<void> {
    const entity = await this.DB.manager.save(UserEntity, this.toObject());
    Object.assign(this, entity);
  }

  toObject(): UserArg {
    const { ID, name, password, salt, isLoggedIn, version } = this;
    return { ID, name, password, salt, isLoggedIn, version };
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

  version: Number
});

const UserChangeAdd = new ObjectModel({
  ID: [Number],
  name: String,
  password: String,
  salt: String,

  version: undefined
});

const UserChangeSet = new ObjectModel({
  ID: Number,
  name: [String],
  password: [String],
  salt: [String],

  version: undefined
});

const UserChangeDel = new ObjectModel({
  ID: [Number],
  name: [String],

  version: undefined
});