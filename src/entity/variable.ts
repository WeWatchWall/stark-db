import { Entity, PrimaryColumn, Column } from "typeorm"

class StarkVariableData {
  name: string;
  value?: boolean | number | string;
}

@Entity()
export class StarkVariable {

  constructor(init: StarkVariableData) {
    Object.assign(this, init);
  }

  @PrimaryColumn()
  name: string;

  @Column({ type: 'text' })
  value: boolean | number | string;

}
