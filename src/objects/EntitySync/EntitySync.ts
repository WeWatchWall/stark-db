import { Store } from 'tinybase/store';
import { useOptionsStore } from '../../stores/options';
import { IConnection } from '../Connection/IConnection';
import { IEntitySync, IEntitySyncArg } from './IEntitySync';
import { PGEntitySync } from './PGEntitySync';
import { SQLiteEntitySync } from './SQLiteEntitySync';

export class EntitySync implements IEntitySync {
  private driver: SQLiteEntitySync | PGEntitySync;

  constructor(arg: IEntitySyncArg) {
    const optionsStore = useOptionsStore();
    this.driver = optionsStore.engine === 'SQLite' ?
        new SQLiteEntitySync(arg) :
        new PGEntitySync(arg);
  }

  get connection(): IConnection {
    return this.driver.connection;
  }
  set connection(_connection: IConnection) {
    throw new Error('Invalid operation.');
  }

  async get(): Promise<Store> {
    return await this.driver.get();
  }
  async destroy() {
    return await this.driver.destroy();
  }
}