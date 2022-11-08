import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

export class DBData {
  id?: number;
  name: string;
  path?: string;
}

@Entity()
export class Database {

  constructor(init: DBData) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

}