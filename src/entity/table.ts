import { Column, Entity, PrimaryColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class TableArg implements IEntityArg {
  name?: string;
  isMemory?: boolean;
  isPersist?: boolean;
}

@Entity({name: '_stark_tables'})
export class Table implements IEntity {

  constructor(init: TableArg) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;
  
  @Column("simple-json")
  keys: string[];

  @Column()
  isMemory: boolean;

  @Column()
  isPersist: boolean;

}