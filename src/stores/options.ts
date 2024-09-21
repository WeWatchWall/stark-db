import { defineStore } from 'pinia';
import { DB_TYPES } from '../utils/constants';

interface Options {
  address: string,
  doc: string,
  port: number;
  ssl: number;
  cookie: boolean;
  certs: string,
  engine: DB_TYPES;
  data: string;
  pghost: string;
  pgport: number;
  pguser: string;
  pgpassword: string;
}

export const useOptionsStore = defineStore('options', {
  state: () => ({
    address: '127.0.0.1',
    doc: 'https://127.0.0.1',
    port: 5983,
    ssl: 5984,
    cookie: false,
    certs: './certs',
    engine: 'SQLite' as DB_TYPES,
    data: './data',
    pghost: 'localhost',
    pgport: 5432,
    pguser: 'postgres',
    pgpassword: 'postgres',
  }),
  actions: {
    setOptions(options: Partial<Options>) {
      Object.assign(this, options);
    },
  },
});