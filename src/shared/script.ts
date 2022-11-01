import { ArrayModel, ObjectModel } from 'objectmodel';

import { DELIMITER, NEWLINE } from './constants';
import { LazyLoader } from './lazyLoader';
import { LazyValidator } from './lazyValidator';
import { ParseType, Statement } from './statement';

export class ScriptData {
  script?: string;
  statements?: Statement[];
}

export class Script {
  loader: LazyLoader;
  validator: LazyValidator;

  script: string;
  statements: Statement[];

  private isSave: boolean;

  /**
   * Creates an instance of a SQL script.
   * @param [init] @type {StatementData} The initial values.
   */
  constructor(init: ScriptData) {
    // Hook up the loader.
    this.loader = new LazyLoader(
      () => this.load.apply(this, []),
      () => this.save.apply(this, [])
    );

    // Apply the arguments and load the script.
    if (init !== undefined) {
      Object.assign(this, init);
      this.script = this.script?.trim();

      this.loader.save();
    }
  }

  /* #region  Loads from the script string. */
  private load(): void {
    this.validator = new LazyValidator(
      () => this.loadValidate.apply(this, []),
      () => this.loadReady.apply(this, [])
    );

    this.isSave = false;
    try {
      this.validator.valid();
    } catch (error) {
      this.isSave = true;
    }

    if (this.isSave) { return; }
    
    this.validator.ready();
  }

  private loadValidate(): void {
    new ScriptLoad(this);
  }

  private loadReady(): void {
    // Split the script into statements.
    const statements = this
      .script
      .split(DELIMITER)
      .filter((statement) => statement.trim() !== '')
      .map((statement) => `${ statement.trim() }${ DELIMITER }`);

    // Parse the script statements.
    this.statements = statements.map((statement: string, index: number) => {
      const statementMeta = new Statement({ statement, index });
      statementMeta.validator.ready();
      return statementMeta;
    });

    // Set the statement.isTransaction property.
    let isTransaction = false;
    for (const statement of this.statements) {
      if (statement.type === ParseType.begin_transaction) {
        isTransaction = true;
      }

      statement.isTransaction = isTransaction;

      if (statement.type === ParseType.commit_transaction) {
        isTransaction = false;
      }
    }
  }
  /* #endregion */

  /* #region  Save to the script string. */
  private save(): void {
    // Don't run the save if this is a load.
    if (!this.isSave) { return; }

    this.validator = new LazyValidator(
      () => this.saveValidate.apply(this, []),
      () => this.saveReady.apply(this, [])
    );
    this.validator.ready();
  }

  private saveValidate(): void {
    new ScriptSave(this);
  }

  private saveReady(): void {
    let statements = [];

    for (const statement of this.statements) {
      statement.validator.ready();
      statements.push(statement.toString());
    }

    this.script = statements.join(NEWLINE);
  }
  /* #endregion */

  /**
   * Gets the string representation of the instance.
   * @returns string 
   */
  toString(): string {
    return this.script;
  }
}

/* #region  Use schema to check the properties. */
const ScriptLoad = new ObjectModel({
  script: String,
  statements: undefined,
});

const ScriptSave = new ObjectModel({
  script: [String],
  statements: ArrayModel(Statement),
});
/* #endregion */