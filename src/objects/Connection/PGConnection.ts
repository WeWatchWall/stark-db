import pg from 'pg'
import { IConnection, IConnectionArg, IConnectionSchema } from './IConnection';
import { useOptionsStore } from '../../stores/options';

export class PGConnection implements IConnection {
  name: string;
  connection: pg.Client;

  constructor(arg: IConnectionArg) {
    IConnectionSchema.parse(arg);
    this.name = arg.name;
  }

  async get(): Promise<boolean> {
    return !!this.connection;
  }
  async add() {
    const optionsStore = useOptionsStore();
    this.connection = new pg.Client({
      database: this.name.toLowerCase(),
      host: optionsStore.pghost,
      port: optionsStore.pgport,
      user: optionsStore.pguser,
      password: optionsStore.pgpassword
    });

    await this.connection.connect();
  }
  
  async destroy() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}