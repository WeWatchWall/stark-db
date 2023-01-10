# Stark-DB

[![Build and test status](https://github.com/WeWatchWall/stark-db/workflows/Lint%20and%20test/badge.svg)](https://github.com/WeWatchWall/stark-db/actions?query=workflow%3A%22Lint+and+test%22)
[![NPM version](https://img.shields.io/npm/v/stark-db.svg)](https://www.npmjs.com/package/stark-db)

Persistent SQL engine with TypeScript APIs for quick and easy production apps.
The goal of this project is to be isomorphic, so that the same user code
runs both on servers as well as in browsers.

## Getting Started

```bash
npm install stark-db
```

## Usage and Options

### Long Transactions and Failures

The design for concurrent writes relies on a central queue that orders short
transactions. Short results are communicated across threads, and re-run if there
are any collisions of target IDs.

Long transactions are run serially and block up all the writes until
they are complete. Long transactions are ones that:

- specified long by setting the value of isWAL in the variables table
- modify a parameter-specified number of rows (TODO: what parameter?)
- modify the schema
- read and write data in the same query -- i.e.:
  - `INSERT... SELECT FROM ...`
  - `CREATE TABLE ... AS SELECT ...`
- delete data -- mark as inactive and subsequently clean the table
- all other queries that are not related to transactions, tables, or data.

If the transaction is long because of the large set of changes,
then it has to run twice - once to detect that it is long, and again to commit.
A good way to avoid such issues is to run a `SELECT ... LIMIT ${PARAM + 1}`
query and to check the length of the results against the long transaction
parameter. Then, include the query to mark the transaction as long
(isWAL = false): `UPDATE _stark_variable SET value = 0 WHERE name = 'isWAL'`.
That variable's value is always reset to true (1) at the end of the transaction.

### Interactive Transactions

Interactive transactions are always treated as long-running ones.
They are distinct in a few ways:

- They wait for all other writes to complete.
- Any changes to variable settings should be executed first,
    or they are ignored.
- Any queries after a rollback or commit transaction query are ignored.
- The only way to run an interactive transaction is to begin a transaction
    which runs only until it is commited.
- If the query contains more than one transaction, it is not interactive and
    it is auto-commited instead.

## Roadmap

- HTTPS & authentication.
- Sharding - with a single queue.
- Kubernetes containers.
- Driver architecture for various DB engines.
- Scaling tables & relations across nodes.
