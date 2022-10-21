import 'reflect-metadata';
import initSqlJs from 'sql.js';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';

export async function getAppDataSource(
  database?: Uint8Array
): Promise<DataSource> {
  const SQL = await initSqlJs({
    locateFile: _file => `sql-wasm.wasm`
  });

  return new DataSource({
    database: database,
    type: "sqljs",
    driver: SQL,
    synchronize: true, // TODO: remove this in production
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });
}

