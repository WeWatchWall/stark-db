import postgres from 'postgres';
import { IConnection, IConnectionArg, IConnectionSchema } from './IConnection';
import { useOptionsStore } from '../../stores/options';

export class PGConnection implements IConnection {
  name: string;
  connection: postgres.Sql<{}>;

  constructor(arg: IConnectionArg) {
    IConnectionSchema.parse(arg);
    this.name = arg.name;
  }

  async get(): Promise<boolean> {
    return !!this.connection;
  }
  async add() {
    const optionsStore = useOptionsStore();
    this.connection = postgres("", {
      database: this.name.toLowerCase(),
      host: optionsStore.pghost,
      port: optionsStore.pgport,
      username: optionsStore.pguser,
      password: optionsStore.pgpassword
    });
  }
  
  async destroy() {
    if (this.connection) {
      await this.connection.end();
    }
  }
}