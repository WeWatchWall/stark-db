import sqlite3 from 'sqlite3';
import { IConnection, IConnectionArg, IConnectionSchema } from './IConnection';
import { useOptionsStore } from '../../stores/options';
import flatPromise from '../../utils/flatPromise';

export class SQLiteConnection implements IConnection {
  name: string;
  connection: sqlite3.Database | undefined;

  constructor(arg: IConnectionArg) {
    IConnectionSchema.parse(arg);
    this.name = arg.name;
  }

  async get(): Promise<boolean> {
    return !!this.connection;
  }

  async add() {
    const optionsStore = useOptionsStore();
    const databaseFilePath = `${optionsStore.data}/${this.name}`;

    const { promise, resolve, reject } = flatPromise();

    this.connection = new sqlite3.Database(databaseFilePath, (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      }

      resolve();
    });

    await promise;
  }

  async destroy() {
    if (!this.connection) { return }

    const { promise, resolve, reject } = flatPromise();

    this.connection.close((err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      }

      resolve();
    });

    await promise;
    delete this.connection;
  }
}