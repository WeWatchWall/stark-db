import { Column, Entity, PrimaryColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class TableArg implements IEntityArg {
  name?: string;
  isMemory?: boolean;
  isPersist?: boolean;
}

@Entity()
export class StarkTable implements IEntity {

  constructor(init: TableArg) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;

  @Column()
  isMemory: boolean;

  @Column()
  isPersist: boolean;

}