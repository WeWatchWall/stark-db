import { DataSource } from "typeorm";
import { User } from "../entity/user";
import { StarkVariable } from "../entity/variable";
import { ADMIN_USER, DB_IDENTIFIER } from "../utils/constants";
import { LazyValidator } from "../utils/lazyValidator";
import { IDB, IDBArg } from "./IDB";

export abstract class PersistentDBArgBase implements IDBArg {
  name: string;
  path?: string;

  entities?: any[];
}

export abstract class PersistentDBBase implements IDB {
  validator: LazyValidator;

  name: string;
  path: string;
  fileName: string;

  entities: any[];
  db: DataSource;

  constructor(_init: IDBArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );
  }

  abstract load(): Promise<void>;
  abstract save(): Promise<void>;
  abstract destroy(): Promise<void>;

  protected abstract validate(): void;
  protected abstract ready(): Promise<void>;

  protected static async readyAdminDB(db: DataSource): Promise<void> {
    // Skip if the DB is already initialized.
    if (await PersistentDBBase.isInitCheck(db)) { return; }

    // Create the admin user.
    const user = new User({
      userName: ADMIN_USER,
      password: '',
      salt: ''
    });
    await db.manager.save(user);

    // Set the DB user_version flag as initialized.
    await PersistentDBBase.isInitSet(db);
  }

  protected static async readyUserDB(db: DataSource): Promise<void> {
    // Skip if the DB is already initialized.
    if (await PersistentDBBase.isInitCheck(db)) { return; }

    /* #region  Add helper variables. */
    const tablesVar = new StarkVariable({
      name: 'tables',
      value: JSON.stringify([])
    });

    const isWALVar = new StarkVariable({
      name: 'isWAL',
      value: false
    });

    const memoryVar = new StarkVariable({
      name: 'memory',
      value: JSON.stringify([])
    });

    const isMemoryVar = new StarkVariable({
      name: 'isMemory',
      value: true
    });

    const lastAccess = new StarkVariable({
      name: 'lastAccess',
      value: Date.now()
    });

    await db.manager.save(tablesVar);
    await db.manager.save(isWALVar);
    await db.manager.save(memoryVar);
    await db.manager.save(isMemoryVar);
    await db.manager.save(lastAccess);
    /* #endregion */

    // Set the DB user_version flag as initialized.
    await PersistentDBBase.isInitSet(db);
  }

  /**
   * Check if the database is already initialized.
   * @param db @type {DataSource} The database. 
   * @returns isInit @type {boolean} True if the database is initialized.
   */
   private static async isInitCheck(db: DataSource): Promise<boolean> {
    const result = await db.query(`PRAGMA user_version;`);

    return result[0][`user_version`] === DB_IDENTIFIER;
  }

  /**
   * Set the database user_version ID.
   * @param db @type {DataSource} The database. 
   * @returns @type {void}
   */
  private static async isInitSet(db: DataSource): Promise<void> {
    // This query doesn't work with parameters.
    await db.query(`PRAGMA user_version = ${DB_IDENTIFIER};`);
  }
}