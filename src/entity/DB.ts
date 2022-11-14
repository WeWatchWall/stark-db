import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IDB } from '../objects/IDB';

import { IEntity, IEntityArg } from './IEntity';

export class DBArg implements IEntityArg {
  id?: number;
  name?: string;
  path?: string;
}

@Entity()
export class Database implements IEntity {

  constructor(init: DBArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  path: string;

  userDB: IDB;

}