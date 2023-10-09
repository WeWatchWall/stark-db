import express from 'express';
import asyncHandler from 'express-async-handler';
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
  const connection = Services.DBFile.get(req.sessionID, req.params.DB);
  if (!connection) {
    res.sendStatus(403);
    return;
  }

  if (!req.body.query) {
    res.sendStatus(500);
    return;
  }

  /* #endregion */
  try {
    const result = await connection.query(req.body.query, req.body.params);
    res.status(200).send({ result });
  } catch (error) {
    res.sendStatus(500);
  }
  
}));

export default router;