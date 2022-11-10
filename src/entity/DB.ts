import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityData } from './IEntity';

export class DBData implements IEntityData {
  id?: number;
  name?: string;
  path?: string;
}

@Entity()
export class Database implements IEntity {

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