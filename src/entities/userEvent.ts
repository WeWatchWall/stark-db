import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';
import { EventType } from './eventType';

export class UserEventArg implements IEntityArg {
  version?: number;
  type: EventType;

  ID?: number;
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
  version: number;

  @Column({ type: 'text' })
  type: EventType;

  @Column("integer")
  ID: number;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  salt?: string;

}