export class DB {
  id: string; // Primary Key
  enabled: boolean;
  readers: string[];
  writers: string[];
}