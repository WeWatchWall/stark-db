import { IEntity, IEntityData } from "../entity/IEntity";

export interface IServiceArg {};

export interface IService {
  add(arg: IEntityData): Promise<IEntity>;
  delete(arg: IEntityData): Promise<IEntity>;

  destroy(): Promise<void>;
}