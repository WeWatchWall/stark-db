import { unlinkSync } from 'fs';
import path from 'path';
import { Database } from '../../entity/DB';

export class DBManager {
  static async delete(arg: Database): Promise<void> {
    const filePath = path.resolve(arg.path, arg.name);
    unlinkSync(filePath);
  }
}