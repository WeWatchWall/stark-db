import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

export class CommitArg implements IEntityArg {
  id?: number;
  isLong?: boolean;
  isLongQuery?: boolean;
}

@Entity({ name: '_stark_commits' })
export class Commit implements IEntity {

  constructor(init: CommitArg) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isLong: boolean;
  
  @Column()
  isLongQuery: boolean;
}