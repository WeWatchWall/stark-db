import { Column, Entity, PrimaryColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

class StarkVariableArg implements IEntityArg {
  name: string;
  value?: boolean | number | string;
}

@Entity()
export class StarkVariable implements IEntity {

  constructor(init: StarkVariableArg) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;

  @Column({ type: 'text' })
  value: boolean | number | string;

}
