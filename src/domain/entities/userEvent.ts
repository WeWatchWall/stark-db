import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class UserEventArg implements IEntityArg {
  EID?: number;
  ID: number;
  name?: string;
  password?: string;
  salt?: string;
}

@Entity()
export class UserEvent implements IEntity {

  constructor(init: UserEventArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  EID: number;

  @Column("integer")
  ID: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  salt?: string;

}