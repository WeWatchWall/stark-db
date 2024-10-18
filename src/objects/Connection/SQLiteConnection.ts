import Database, { Database as DatabaseType } from 'better-sqlite3';
import { IConnection, IConnectionArg, IConnectionSchema } from './IConnection';
import { useOptionsStore } from '../../stores/options';
import flatPromise from '../../utils/flatPromise';

export class SQLiteConnection implements IConnection {
  name: string;
  connection: DatabaseType | undefined;

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


    this.connection = new Database(databaseFilePath);
  }

  async destroy() {
    if (!this.connection) { return }

    this.connection.close();
    delete this.connection;
  }
}