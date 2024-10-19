export class DB {
  name: string; // Primary Key
  enabled: boolean;
  admins: string[];
  readers: string[];
  writers: string[];
}