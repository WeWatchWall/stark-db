import express from 'express';
import asyncHandler from 'express-async-handler';
import { inspect } from 'util'

import { Query } from '../services/query';
import { Services } from './services';

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
  const { DB, connection } =
    Services.DBFile.get(req.sessionID, req.params.DB);

  if (!connection) {
    res.sendStatus(403);
    return;
  }
  /* #endregion */

  // Execute the script.
  try {
    const result = await Query.add(
      req.session.user,
      DB,
      connection,
      req.body.query,
      req.body.params
    );
    res.status(200).send({ result });
  } catch (error: any) {
    res.status(500).send({
      error: `${error.name}: ${error.message}`,
      stack: error.stack,
    });
  }
  
}));

export default router;