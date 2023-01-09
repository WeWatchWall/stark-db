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

Long transactions still block up all the writes until
they are complete. Long transactions are ones that:

- modify a parameter-specified number of rows (TODO: what parameter?)
- modify the schema
- read and write data in the same query -- i.e.:
  - `INSERT... SELECT FROM ...`
  - `CREATE TABLE ... AS SELECT ...`
- delete data -- mark as inactive and subsequently clean the table
- specified long by setting the value of isWAL in the variables table

If the transaction is long because of the large set of changes,
then it has to run twice - once to detect that it is long, and again to commit.
A good way to avoid such issues is to run a `SELECT ... LIMIT ${PARAM + 1}`
query and to check the length of the results against the long transaction
parameter. Then, include the query to mark the transaction as long
(isWAL = false): `UPDATE _stark_variable SET value = 0 WHERE name = 'isWAL'`.
That variable's value is always reset to true (1) at the end of the transaction.

## Roadmap

- Sharding - with a single queue.
- Driver architecture for various DB engines.
- Scaling tables & relations across nodes.
