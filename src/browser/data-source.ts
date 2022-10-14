import 'reflect-metadata';
import initSqlJs from 'sql.js/dist/sql-wasm.js';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';

export async function getAppDataSource() {
  const SQL = await initSqlJs();

  return new DataSource({
    type: "sqljs",
    driver: SQL,
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });
};


