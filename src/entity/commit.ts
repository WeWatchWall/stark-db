import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { COMMITS_TABLE } from '../utils/constants';

import { IEntity, IEntityArg } from './IEntity';

export class CommitArg implements IEntityArg {
  id?: number;
  query?: string;
  params?: any[];

  isSaved?: boolean;
  isLong?: boolean;
  isLongQuery?: boolean;
}

@Entity({ name: COMMITS_TABLE })
export class Commit implements IEntity {

  constructor(init: CommitArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  query?: string;

  @Column("simple-json", { nullable: true })
  params?: any[];
  
  @Column()
  isSaved: boolean;

  @Column({ nullable: true })
  isLong?: boolean;
  
  @Column({ nullable: true })
  isLongQuery?: boolean;
}