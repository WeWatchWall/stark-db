import express from 'express';
import asyncHandler from 'express-async-handler';
import { DataSource } from 'typeorm';

import { Query } from '../services/query';
import { Services } from './services';
import { ScriptParse } from '../parser/scriptParse';

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
  const connection: DataSource =
    Services.DBFile.get(req.sessionID, req.params.DB);

  if (!connection) {
    res.sendStatus(403);
    return;
  }
  /* #endregion */

  // Parse the script.
  const scriptParse = new ScriptParse({
    script: req.body.query,
    params: req.body.params
  });

  // Execute the script.
  try {
    const result = await Query.add(
      connection,
      scriptParse
    );
    res.status(200).send({ result });
  } catch (error: any) {
    res.status(500).send({
      error: error,
      stack: error.stack,
    });
  }
  
}));

export default router;