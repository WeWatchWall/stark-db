import { Column, Entity, PrimaryColumn } from 'typeorm';

import { TABLES_TABLE } from '../utils/constants';
import { IEntity, IEntityArg } from './IEntity';

export class TableArg implements IEntityArg {
  name?: string;
  keys?: string[];
  isMemory?: boolean;
  changeCount?: number;
}

@Entity({name: TABLES_TABLE})
export class Table implements IEntity {

  constructor(init: TableArg) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;

  @Column("simple-json")
  autoKeys: string[];

  @Column("simple-json")
  keys: string[];

  @Column()
  isMemory: boolean;

  @Column()
  changeCount: number;
}