import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';
import { EventType } from './eventType';

export class DBEventArg implements IEntityArg {
  version?: number;
  type: EventType;

  ID: number;
  name?: string;
  admins?: number[];
  readers?: number[];
  writers?: number[];
}

@Entity()
export class DBEvent implements IEntity {

  constructor(init: DBEventArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  version: number;
    
  @Column("enum", { enum: EventType })
  type: EventType;

  @Column("integer")
  ID: number;

  @Column({ nullable: true })
  name?: string;

  @Column("simple-json", { nullable: true })
  admins?: number[];

  @Column("simple-json", { nullable: true })
  readers?: number[];

  @Column("simple-json", { nullable: true })
  writers?: number[];

}