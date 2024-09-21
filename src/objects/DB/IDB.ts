export interface IDB {
  name: string;
  path?: string;

  add(): void;
  delete(): void;
  set(name: string): void;
}