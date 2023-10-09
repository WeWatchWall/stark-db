import { DB } from "../services/DB";
import { DBFile } from "../services/DBFile";
import { User } from "../services/user";

export class Services {
  static DB: DB;
  static User: User;
  static DBFile: DBFile;
}