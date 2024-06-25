// Numbers
export const ZERO = 0;
export const ONE = 1;

// Databases
export const ADMIN_NAME = 'admin';

// Tables
const TABLE_PREFIX = 'stark_';

export const VARS_TABLE = `${TABLE_PREFIX}variables`;

// Drivers
export const SQLITE_DRIVER = 'sqlite';
export const POSTGRES_DRIVER = 'postgres';

// DB Identifiers
export const DB_IDENTIFIER = 1663328354;
export const DB_IDENTIFIER_ADMIN = 1663328355;

// Timeouts
export const SESSION_EXPIRY = 1e3 * 60 * 60 * 24;
export const CONNECTION_EXPIRY = 1e3 * 60 * 60;
export const DB_EXISTS_CHECK = 5e3;
export const DOMAIN_EVENT_PERSIST = 1e3 * 60 * 10;