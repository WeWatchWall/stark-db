import { Column, Entity, PrimaryColumn } from 'typeorm';

import { IEntity, IEntityArg } from './IEntity';

class VariableArg implements IEntityArg {
  name: string;
  value?: boolean | number | string;
}

@Entity({ name: '_stark_vars' })
export class Variable implements IEntity {

  constructor(init: VariableArg) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;

  @Column({ type: 'text' })
  value: boolean | number | string;

}
