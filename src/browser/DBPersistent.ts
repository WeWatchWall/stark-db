import localforage from 'localforage';
import { Any, ArrayModel, BasicModel, ObjectModel } from 'objectmodel';
import initSqlJs from 'sql.js';
import { DataSource } from 'typeorm';
import { SqljsEntityManager } from 'typeorm/entity-manager/SqljsEntityManager';

import { IDB } from '../shared/objects/IDB';
import { LazyValidator } from '../shared/utils/lazyValidator';

const MIN_INTERVAL = 0.5e3;
const DEFAULT_INTERVAL = 10e3;

export class PersistentDBArg {
  name: string;
  path: string;
  saveInterval?: number;
  entities?: any[];
}

export abstract class PersistentDB implements IDB {
  validator: LazyValidator;

  name: string;
  path: string;
  fileName: string;
  entities?: any[];
  db: DataSource;
  saveInterval?: number;

  private interval: ReturnType<typeof setInterval>;
  private static driver: any;

  protected validate(): void {
    new PersistentDBInit(this);

    this.entities = this.entities || [];
  }

  protected async ready(): Promise<void> {
    // Lazy initialization of the driver.
    if (PersistentDB.driver === undefined) {
      PersistentDB.driver = await initSqlJs({
        locateFile: (_path: string) => `sql-wasm.wasm`
      });
    }

    this.fileName = this.path + this.name;

    // Open the database.
    await this.load();

    // Start the save interval.
    this.interval = setInterval(async () => {
      await this.save();
    }, this.saveInterval);    
  }

  async load(): Promise<void> {
    const database: Uint8Array = await localforage.getItem(this.fileName);

    this.db = new DataSource({
      database,
      type: "sqljs",
      driver: PersistentDB.driver,
      synchronize: true, // TODO: remove this in production
      logging: false,
      entities: this.entities,
    });

    await this.db.initialize();
  }

  async save(): Promise<void> {
    const dbData = (<SqljsEntityManager>this.db.manager).exportDatabase();
    await localforage.setItem(this.fileName, dbData);
  }

  async destroy(): Promise<void> {
    clearInterval(this.interval);
    delete this.interval;

    await this.save();
    await this.db.destroy();
  }
}

/* #region  Use schema to check the properties. */
const Integer = BasicModel(Number)
  .assert(Number.isSafeInteger)
  .as("Integer");
const PositiveInteger = Integer
  .assert(function isPositive(n) { return n >= MIN_INTERVAL })
  .as("PositiveInteger");
const PersistentDBInit = new ObjectModel({
  name: String,
  path: String,
  entities: ArrayModel(Any),
  saveInterval: [PositiveInteger],
}).defaultTo({
  path: '',
  entities: [],
  saveInterval: DEFAULT_INTERVAL
});
/* #endregion */