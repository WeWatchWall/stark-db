import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class UserArg implements IEntityArg {
  ID?: number;
  name: string;
  password: string;
  salt: string;
}

@Entity()
export class User implements IEntity {

  constructor(init: UserArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  ID: number;

  @Column({ unique: true })
  name: string;

  @Column()
  password: string;

  @Column()
  salt: string;

}