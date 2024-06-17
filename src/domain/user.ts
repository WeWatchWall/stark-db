import { ObjectModel } from "objectmodel";
import { DataSource, MoreThan } from "typeorm";

import { User as UserEntity } from "./entities/user";
import { LazyValidator } from "../utils/lazyValidator";
import { Password } from "../utils/password";
import { UserEvent } from "./entities/userEvent";
import { EventType } from "./entities/eventType";

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
  private validator: LazyValidator;

  DB: DataSource;

  ID: number;
  name: string;
  password: string;
  salt: string;

  isLoggedIn = false;

  version: number;

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
    if (event.type === EventType.add || event.type === EventType.del) {
      return;
    }

    for (const [key, value] of Object.entries(event)) {
      if (key === "type") { continue; }
      if (value === undefined || value === null) { continue; }
      
      (this as any)[key] = value;
    }
  }

  async save(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateSave.apply(this, []),
      () => this.readySave.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  validateSave(): void { new UserSave(this); }
  async readySave(): Promise<void> {
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