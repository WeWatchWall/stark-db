// import 'reflect-metadata';
import localforage from 'localforage';
import { SqljsEntityManager } from 'typeorm/entity-manager/SqljsEntityManager';

import { getAppDataSource } from './browser/data-source';
import { User } from './entity/User';

export async function main() {
  let db = await localforage.getItem('db');
  const appDataSource = await getAppDataSource(<Uint8Array>db);
  await appDataSource.initialize();

  console.log("Inserting a new user into the database...");
  const user = new User();
  user.firstName = "Timber";
  user.lastName = "Saw";
  user.age = 25;
  await appDataSource.manager.save(user);
  console.log("Saved a new user with id: " + user.id);

  console.log("Loading users from the database...");
  const users = await appDataSource.manager.find(User);
  console.log("Loaded users: ", users);

  console.log("Saving the database to localstorage...");
  db = (<SqljsEntityManager>appDataSource.manager).exportDatabase();
  await localforage.setItem('db', db);
  console.log("Saved the database...");

  console.log("You can setup and run express / fastify / any other framework.");
}