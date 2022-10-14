import 'reflect-metadata';

import { DataSource } from 'typeorm';
import { User } from '../entity/User';

export async function getAppDataSource(): Promise<DataSource> {
  return new DataSource({
    type: "better-sqlite3",
    database: "./test.db",
    statementCacheSize: 200,
    cache: true,
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  });
}
