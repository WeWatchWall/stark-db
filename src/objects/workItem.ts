import { ObjectModel } from "objectmodel";
import { LazyValidator } from "../utils/lazyValidator";
import { ResultList } from "./resultList";

class WorkItemArg {
  id: number;
  DB?: ResultList;
  mem?: ResultList;

  isDB?: boolean;
  isMem?: boolean;
};

export class WorkItem {
  id: number;
  DB?: ResultList;
  mem?: ResultList;

  isDB?: boolean;
  isMem?: boolean;
  
  /**
   * Creates an instance of the class.
   * @param [init] @type {WorkItemArg} The initial value.
   */
  constructor(init?: WorkItemArg) {
    this.validator = new LazyValidator(
      () => this.validate.apply(this, []),
    );

    // Copy the properties.
    if (init != undefined) {
      Object.assign(this, init);
      this.validator.valid();
    }
  }
  
  private validator: LazyValidator;
  private validate(): void {
    new WorkItemInit(this);
  }
}

/* #region  Use schema to check the properties. */
const WorkItemInit = new ObjectModel({
  id: Number,
  DB: [ResultList],
  mem: [ResultList],

  isDB: [Boolean],
  isMem: [Boolean]
});
/* #endregion */