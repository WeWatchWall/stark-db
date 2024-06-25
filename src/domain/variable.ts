import { ObjectModel } from "objectmodel";
import { DataSource } from "typeorm";

import { Variable as VariableEntity } from "../entities/variable";

export class VariableArg {
  DB?: DataSource;

  name?: string;
  value?: boolean | number | string;
}

export class Variable {

  DB: DataSource;

  name: string;
  value: boolean | number | string;

  constructor(init: VariableArg) {
    if (init != undefined) {
      Object.assign(this, init);
      this.validateInit();
      this.readyInit();
    }
  }
  private validateInit(): void { new VariableInit(this); }
  private readyInit(): void { } // NOOP

  async load(): Promise<void> {
    this.validateLoad();
    await this.readyLoad();
  }
  validateLoad(): void { new VariableLoad(this); }
  async readyLoad(): Promise<void> {
    const entity = await this.DB.manager.findOneByOrFail(VariableEntity, {
      name: this.name,
    });
    Object.assign(this, entity);
  }

  async save(arg: VariableArg): Promise<void> {
    this.validateSave(arg);
    await this.readySave(arg);
  }
  validateSave(arg: VariableArg): void { new VariableSave(arg); }
  async readySave(arg: VariableArg): Promise<void> {
    await this.DB.manager.save(VariableEntity, arg);
  }

  async delete(): Promise<void> {
    this.validateDelete();
    await this.readyDelete();
  }
  validateDelete(): void { new VariableLoad(this); }
  async readyDelete(): Promise<void> {
    await this.DB.manager.delete(VariableEntity, {
      name: this.name,
    });
  }
}

const VariableInit = new ObjectModel({
  DB: DataSource,
});

const VariableLoad = new ObjectModel({
  name: String
});

const VariableSave = new ObjectModel({
  name: String,
  value: [Boolean, Number, String],
});