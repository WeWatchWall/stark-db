import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityData } from './IEntity';

export class UserData implements IEntityData {
  id?: number;
  userName?: string;
  password?: string;
  salt?: string;
}

@Entity()
export class User implements IEntity {

  constructor(init: UserData) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userName: string;

  @Column()
  password: string;

  @Column()
  salt: string;

}
