# stark-db

[![Build and test status](https://github.com/WeWatchWall/stark-db/workflows/Node.js%20CI/badge.svg)](https://github.com/WeWatchWall/stark-db/actions?query=workflow%3A%22Node.js+CI%22)
[![NPM version](https://img.shields.io/npm/v/stark-db.svg)](https://www.npmjs.com/package/stark-db)

SQLite-backed, change-tracking database available over HTTP.


## Installation

```bash
npm i -g stark-db
```

## Basics

Run with:

```bash
stark-db
```

By default, the DB engine is configured to run over SSL. While some self-signed
ssl certificates are automatically generated, they are not ever valid so
the user must supply their own. Then, the user needs to set the `-c` flag
in order to enable the cookie security. Only then is this system ready for
use in production.

There is a Swagger endpoint `https://127.0.0.1:5984/api-docs` where the user can
try out the routes available.

You may want to use `BEGIN IMMEDIATE TRANSACTION;` if you write to the database
concurrently as SQLite will throw busy errors otherwise.

This database tracks changes to all entities in the auto-created column(on all
tables) `stark_version`. There is also an extra table generated with any
user-created table called `_stark_del_${name}`. Deletions are tracked
in this auxiliary set of tables. With the help of this change tracking,
synchronization mechanisms can be built later. The user has the option
of using soft deletion -- marking data as deleted -- or relying on an
`id` column to track such deletions. ROWID would not work in a synchronization
scenario. Any modifications made by stark-db to the sqlite database
can be seen by running `select * from sqlite_master;` and the user can edit the
triggers/tables.
Also, the `-f` flag prevents all modifications related to change tracking.

It is recommended to invoke the API one query at a time although it is possible
to execute multiple statements in a single invocation. Interactive queries are
supported due to the stateful nature of the API. A DB connection is marked
inactive and is refreshed after 1 hour. A session cookie to the server is marked
inactive after 1 day.

## CLI

```bash
  -a, --address <address>    HTTP address to listen on. Env var: STARK_DB_HTTP_LISTEN_ADDRESS (default: "127.0.0.1")
  -i, --doc <address>        Address to query by the documentation. Env var: STARK_DB_DOC_ADDRESS (default: "https://127.0.0.1")
  -p, --port <port>          HTTP port to listen on. Env var: STARK_DB_HTTP_PORT (default: "5983")
  -s, --ssl <port>           HTTPS port to listen on. Env var: STARK_DB_HTTPS_PORT (default: "5984")
  -c, --cookie               Secure cookie, served over valid HTTPS only. Env var: STARK_DB_COOKIE (default: false)
  -k, --certs <path>         Path to the certs directory. Env var: STARK_DB_CERTS_DIR (default: "./certs")
  -f, --simple               Do not run change-tracking queries. Env var: STARK_DB_SIMPLE (default: true)
  -e, --engine <engine>      The DB engine running underneath, i.e. sqlite or postgres. Env var: STARK_DB_ENGINE (default: "sqlite")
  -d, --data <path>          Path to the data directory. Env var: STARK_DB_DATA_DIR (default: "./data")
  -g, --host <path>          Address of the engine host. Env var: STARK_DB_ENGINE_HOST (default: "localhost")
  -r, --hostPort <port>      Port of the engine host. Env var: STARK_DB_ENGINE_PORT (default: "5432")
  -u, --username <username>  Username for the engine host. Env var: STARK_DB_ENGINE_USERNAME (default: "postgres")
  -q, --password <password>  Password for the engine host. Env var: STARK_DB_ENGINE_PASSWORD (default: "postgres")
  -h, --help                 display help for command
```
## Wiki
See the Wiki for [HTTP API Documentation](https://github.com/WeWatchWall/stark-db/wiki/HTTP-API-Documentation).
