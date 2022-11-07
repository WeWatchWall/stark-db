import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

class UserData {
  userName: string;
  password: string;
  salt: string;
}

@Entity()
export class User {

  constructor(init: UserData) {
    Object.assign(this, init);
  }

  @PrimaryGeneratedColumn()
  id: number

  @Column()
  userName: string

  @Column()
  password: string

  @Column()
  salt: string

}
