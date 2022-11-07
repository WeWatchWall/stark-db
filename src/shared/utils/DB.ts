import { DataSource } from 'typeorm';
import { User } from '../../entity/user';

import { ADMIN_USER, DB_IDENTIFIER } from './constants';

export class DBUtils {
  static async readyAdminDB(db: DataSource): Promise<void> {
    if (await DBUtils.isInitCheck(db)) { return; }

    const user = new User({
      userName: ADMIN_USER,
      password: '',
      salt: ''
    });
    await db.manager.save(user);

    

    // Set the DB user_version flag as initialized.
    await DBUtils.isInitSet(db);
  }

  static async readyUserDB(db: DataSource): Promise<void> {
    // Skip if the DB is already initialized.
    if (await DBUtils.isInitCheck(db)) { return; }


    // Set the DB user_version flag as initialized.
    await DBUtils.isInitSet(db);
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