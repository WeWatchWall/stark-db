import { Method } from "./method";

const DEL_TABLE_PREFIX = '_stark_del';
const TRIGGER_PREFIX = '_stark_trigger';

const WORKER_CHANNEL = 'stark-worker';

export class Names {
  static VERSION_COLUMN = '_stark_version';

  /* #region Channels. */
  static getWorkerMemTablesReset(name: string): string {
    return `${WORKER_CHANNEL}-${name}-reset`;
  }
  /* #endregion */

  /* #region SQL schema. */
  static getDelTable(name: string): string {
    return `${DEL_TABLE_PREFIX}_${name}`;
  }

  static getTrigger(name: string, method: Method): string {
    return `${TRIGGER_PREFIX}_${method}_${name}`;
  }
  /* #endregion */
}