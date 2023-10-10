import express from 'express';
import asyncHandler from 'express-async-handler';
import { Services } from './services';
import { DataSource } from 'typeorm';
import { QueryParse, READ_ONLY_Qs, TABLE_MODIFY_Qs } from '../parser/queryParse';
import { QueryUtils } from '../utils/queries';
import { SIMPLE, VARS_TABLE } from '../utils/constants';
import { Variable } from '../utils/variable';

const router = express.Router({ mergeParams: true });

router.post('/:DB/query', asyncHandler(async (req: any, res: any) => {
  /* #region Initialize the session user. */
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }
  /* #endregion */

  /* #region Initialize the session DB connection. */
  if (!req.session.DBs || !req.session.DBs.includes(req.params.DB)) {
    res.sendStatus(403);
    return;
  }
  const connection = Services.DBFile.get(req.sessionID, req.params.DB);
  if (!connection) {
    res.sendStatus(403);
    return;
  }

  if (!req.body.query) {
    res.sendStatus(400);
    return;
  }

  /* #endregion */
  try {
    const result = await SingleQuery.run(
      connection,
      req.body.query,
      req.body.params
    );
    res.status(200).send({ result });
  } catch (error: any) {
    res.status(500).send({
      error: error,
      stack: error.stack,
    });
  }
  
}));

class SingleQuery {
  static async run(
    DB: DataSource,
    query: string,
    params: any[] = []
  ): Promise<any> {
    const parsedQuery = new QueryParse({ query, params });
    parsedQuery.validator.ready();

    // Increment the DB version for every write query.
    if (!SIMPLE && !READ_ONLY_Qs.has(parsedQuery.type)) {
      await DB.query(`UPDATE ${VARS_TABLE} SET value = (SELECT value FROM ${VARS_TABLE} WHERE name = "${Variable.version}") + 1 WHERE name="${Variable.version}";`,[]);
    }
    
    if (SIMPLE || !TABLE_MODIFY_Qs.has(parsedQuery.type)) {
      const result = await DB.query(query, params);
      return result;
    }

    const tableQueries: QueryParse[] = await QueryUtils.getTableModify(
      DB,
      parsedQuery
    );

    await DB.query(query, params);
    for (const tableQuery of tableQueries) {
      await DB.query(tableQuery.query, tableQuery.params);
    }
    return [];
  }
}

export default router;