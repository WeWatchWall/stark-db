import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class DBArg implements IEntityArg {
  ID?: number;
  name: string;
  admins: number[];
  users: number[];
}

@Entity()
export class DB implements IEntity {

  constructor(init: DBArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ unique: true })
  name: string;

  @Column("simple-json")
  admins: number[];

  @Column("simple-json")
  users: number[];

}

export class AdminDB extends DB {}