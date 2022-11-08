import localforage from 'localforage';

import { Database } from '../../entity/DB';

export class DBManager {
  static async delete(arg: Database): Promise<void> {
    localforage.removeItem(`${arg.path}/${arg.name}`);
  }
}