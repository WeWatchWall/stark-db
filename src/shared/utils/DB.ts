import { DataSource } from 'typeorm';
import { User } from '../../entity/user';

import { IDENTIFIER } from './constants';

export class DBUtils {
  static async readyAdminDB(db: DataSource): Promise<void> {
    if (await DBUtils.isInitCheck(db)) { return; }

    const user = new User();
    user.firstName = "Admin";
    user.lastName = "Admin";
    user.age = 25;
    await db.manager.save(user);

    console.log("Loading users from the database...");
    const users = await db.manager.find(User);
    console.log("Loaded users: ", users);

    // TODO: Enable setting this flag at the end.
    // await DBUtils.isInitSet(db);
  }

  static async readyUserDB(db: DataSource): Promise<void> {
    if (await DBUtils.isInitCheck(db)) { return; }


    // TODO: Enable setting this flag at the end.
    // await DBUtils.isInitSet(db);
  }

  /**
   * Check if the database is already initialized.
   * @param db @type {DataSource} The database. 
   * @returns isInit @type {boolean} True if the database is initialized.
   */
  private static async isInitCheck(db: DataSource): Promise<boolean> {
    const result = await db.query(`PRAGMA user_version;`);

    return result[0][`user_version`] === IDENTIFIER;
  }

  /**
   * Set the database user_version ID.
   * @param db @type {DataSource} The database. 
   * @returns @type {void}
   */
  // private static async isInitSet(db: DataSource): Promise<void> {
  //   // This query doesn't work with parameters.
  //   await db.query(`PRAGMA user_version = ${IDENTIFIER};`);
  // }
}