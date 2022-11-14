import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class UserArg implements IEntityArg {
  id?: number;
  userName?: string;
  password?: string;
  salt?: string;
}

@Entity()
export class User implements IEntity {

  constructor(init: UserArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userName: string;

  @Column()
  password: string;

  @Column()
  salt: string;

}
