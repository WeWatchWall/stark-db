import { ObjectModel } from "objectmodel";
import { DataSource } from "typeorm";

import { Variable as VariableEntity } from "./entities/variable";
import { LazyValidator } from "../utils/lazyValidator";

export class VariableArg {
  DB?: DataSource;

  name?: string;
  value?: boolean | number | string;
}

export class Variable {
  private validator: LazyValidator;

  DB: DataSource;

  name: string;
  value: boolean | number | string;

  constructor(init: VariableArg) {
    this.validator = new LazyValidator(
      () => this.validateInit.apply(this, []),
      () => this.readyInit.apply(this, [])
    );

    if (init != undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }
  private validateInit(): void { new VariableInit(this); }
  private readyInit(): void { } // NOOP

  async load(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateLoad.apply(this, []),
      () => this.readyLoad.apply(this, [])
    );

    await this.validator.readyAsync();
  }
  validateLoad(): void { new VariableLoad(this); }
  async readyLoad(): Promise<void> {
    const entity = await this.DB.manager.findOneByOrFail(VariableEntity, {
      name: this.name,
    });
    Object.assign(this, entity);
  }

  async save(arg: VariableArg): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateSave.apply(this, [arg]),
      () => this.readySave.apply(this, [arg])
    );

    await this.validator.readyAsync();
  }
  validateSave(arg: VariableArg): void { new VariableSave(arg); }
  async readySave(arg: VariableArg): Promise<void> {
    await this.DB.manager.save(VariableEntity, arg);
  }

  async delete(): Promise<void> {
    this.validator = new LazyValidator(
      () => this.validateDelete.apply(this, []),
      () => this.readyDelete.apply(this, [])
    );
    
    await this.validator.readyAsync();
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