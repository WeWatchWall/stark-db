import { DataSource } from 'typeorm';
import { LazyValidator } from "../utils/lazyValidator";

export interface IDBArg {
  name: string;
  path?: string;
  entities?: any[];
}

export interface IDB {
  validator: LazyValidator;

  name: string;
  path: string;
  fileName: string;
  saveInterval?: number;

  DB: DataSource;

  load(): Promise<void>;
  save(): Promise<void>;
  destroy(): Promise<void>;
}

export interface IAdminDB extends IDB { }
export interface IUserDB extends IDB { }