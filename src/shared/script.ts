import { ArrayModel, ObjectModel } from 'objectmodel';
import sqliteParser from 'sqlite-parser';
import { DELIMITER } from './constants';

import { LazyValidator } from './lazyValidator';
import { Statement } from './statement';

export class ScriptData {
  script: string;
}

export class Script {
  validator: LazyValidator;

  script: string;
  statements: Statement[];
  
  /**
   * Creates an instance of a SQL statement.
   * @param [init] @type {StatementData} The initial values.
   */
  constructor(init?: ScriptData) {
    // Hook up the validator.
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
      () => this.ready.apply(this, [])
    );

    // Initialize the computed properties.
    this.statements = [];
    
    // Copy the properties.
    if (init !== undefined) {
      Object.assign(this, init);
      this.validator.ready();
    }
  }

  private validate(): void {
    new ScriptInitArg(this);

    const statements = this
      .script
      .split(DELIMITER)
      .filter((statement) => statement.trim() !== '')
      .map((statement) => `${statement}${DELIMITER}`);

    const statementMetas = this.statements;
    const parseResult = sqliteParser(this.script); 
    parseResult
      ?.statement
      ?.forEach((meta: any, index: number) =>
        statementMetas.push(new Statement({
          meta, index,
          statement: statements[index]
        }))
      );
  }

  private ready(): void {
    this.statements.forEach((statement) => statement.validator.ready());
  }

  /**
   * Gets the string representation of the instance.
   * @returns string 
   */
  toString(): string {
    return this.script;
  }
}

/* #region  Use schema to check the properties. */
const ScriptInitArg = new ObjectModel({
  script: String,
  statements: ArrayModel(Statement),
});
/* #endregion */