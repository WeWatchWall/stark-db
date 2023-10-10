export const ZERO = 0;
export const ONE = 1;

export const RESULT_PREFIX = 'STARK_RESULT_';

/* #region Parser constants. */
export const NEWLINE = '\n';
export const PARAMETER_TOKEN = '?';
export const STATEMENT_DELIMITER = ';';
export const VALUE_DELIMITER = ',';
/* #endregion */

/* #region Schema constants. */
export const DB_DRIVER = 'sqlite';
export const ADMIN_NAME = 'admin';
export const DB_IDENTIFIER = 1663328354;
export const DB_IDENTIFIER_ADMIN = 1663328355;

export const COMMITS_TABLE = '_stark_commits';
export const TABLES_TABLE = '_stark_tables';
export const VARS_TABLE = '_stark_vars';

export enum Target { DB = 'DB', mem = 'mem' }
/* #endregion */

/* #region Constants that can be defined in the environment */
export const DATA_DIR = process.env.STARK_DB_DATA_DIR || "./data";
export const CERT_DIR = process.env.STARK_DB_CERTS_DIR || "./certs";

export const HTTP_PORT = process.env.STARK_DB_HTTP_PORT || 5983;
export const HTTPS_PORT = process.env.STARK_DB_HTTPS_PORT || 5984;
export const SECURE_COOKIE = process.env.STARK_DB_COOKIE === "true";
export const HTTP_LISTEN_ADDRESS =
  process.env.STARK_DB_HTTP_LISTEN_ADDRESS || "127.0.0.1";
export const DOCUMENTATION_ADDRESS =
  process.env.STARK_DB_DOCUMENTATION_ADDRESS || "https://127.0.0.1";
export const SIMPLE = process.env.STARK_DB_SIMPLE === "true";
/* #endregion */

// prune expired sessions every 24h
export const SESSION_EXPIRY =
  parseInt(process.env.STARK_DB_SESSION_EXPIRY) || 1e3 * 60 * 60 * 24;
export const CONNECTION_EXPIRY = 
  parseInt(process.env.STARK_DB_CONNECTION_EXPIRY) || 1e3 * 60 * 60;

