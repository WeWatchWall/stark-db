import { Column, Entity, PrimaryColumn } from 'typeorm';

import { IEntity, IEntityData } from './IEntity';

class StarkVariableData  implements IEntityData {
  name: string;
  value?: boolean | number | string;
}

@Entity()
export class StarkVariable implements IEntity {

  constructor(init: StarkVariableData) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;

  @Column({ type: 'text' })
  value: boolean | number | string;

}
