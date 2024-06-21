import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class DBArg implements IEntityArg {
  ID?: number;
  name: string;
  admins: number[];
  readers: number[];
  writers: number[];

  version: number;
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
  readers: number[];

  @Column("simple-json")
  writers: number[];

  @Column("integer")
  version: number;

}

export class AdminDB extends DB {}