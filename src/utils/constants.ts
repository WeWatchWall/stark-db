export const ZERO = 0;
export const ONE = 1;

export const NEWLINE = '\n';
export const PARAMETER_TOKEN = '?';
export const STATEMENT_DELIMITER = ';';
export const VALUE_DELIMITER = ',';
export const STATEMENT_PLACEHOLDER = 'SELECT "PLACEHOLDER"';

export const DB_DRIVER = 'sqlite';
export const MESSAGE_EVENT = 'message';

export const DB_IDENTIFIER = 1663328354;

export const ADMIN_DB = 'stark-admin.db';
export const ADMIN_USER = 'system';

export const COMMITS_TABLE = '_stark_commits';
export const TABLES_TABLE = '_stark_tables';
export const VARS_TABLE = '_stark_vars';

export const DIFFS_TABLE_PREFIX = '_stark_diffs_';
export const TRIGGER_PREFIX = '_stark_trigger_';
export const TRIGGER_ADD = 'add_';
export const TRIGGER_SET = 'set_';

export const LONG_COMMIT_DEFAULT = 200;

export enum Target { DB = 'DB', mem = 'mem' }

export const WORKER_CHANNEL = 'stark-worker';
export const QUEUE_CHANNEL = 'stark-queue';
export const SAVER_CHANNEL = 'stark-saver';