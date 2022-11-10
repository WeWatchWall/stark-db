import { IEntity, IEntityArg } from "../entity/IEntity";

export interface IServiceArg {};

export interface IService {
  add(arg: IEntityArg): Promise<IEntity>;
  // set(arg: IEntityArg): Promise<IEntity>;
  // get(arg: IEntityArg): Promise<IEntity[]>;
  delete(arg: IEntityArg): Promise<IEntity>;

  destroy(): Promise<void>;
}