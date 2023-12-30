import express from 'express';
import asyncHandler from 'express-async-handler';
import { DBBase } from '../objects/DB';
import { User } from '../objects/user';
import { Services } from './services';
import { ONE } from '../utils/constants';

const router = express.Router({ mergeParams: true });

router.post('/:DB/login', asyncHandler(async (req: any, res: any) => {
  const { username, password } = req.body;

  /* #region Manage the User. */
  const user = new User({
    DB: Services.DB.adminDB.DB,
    name: username
  });
  await user.load();
  user.login(password);
  if (!user.isLoggedIn) { res.sendStatus(401); return; }

  if (req.session.user && req.session.user.ID !== user.ID) {
    // Logout the current user on user change.
    delete req.session.user;
    delete req.session.DBs;
  }
  /* #endregion */

  /* #region Manage the DB. */
  req.session.DBs = req.session.DBs || [];
  let DB: DBBase;
  try {
    DB = await Services.DB.get({ user, DB: { name: req.params.DB } });
  } catch (error) {
    res.sendStatus(403);
  }
  if (!DB) { return; }
  /* #endregion */

  // Call the DBFile Service to load the DBFile connection.
  await Services.DBFile.add(req.sessionID, DB.toObject());

  /* #region User is logged in and DB is found. */
  req.session.user = user.toObject();

  const DBSet = new Set(req.session.DBs);
  if (DB.ID !== ONE) { DBSet.add(DB.name); } // Don't query the adminDB.
  req.session.DBs = Array.from(DBSet);

  res.sendStatus(200);
  /* #endregion */
}));

router.post('/logout', asyncHandler(async (req: any, res: any) => {
  // Call the DBFile Service to close the DBFile connection.
  for (const DB of req.session.DBs) {
    await Services.DBFile.delete(req.sessionID, DB);
  }

  // Delete the session user and DBs.
  delete req.session.user;
  delete req.session.DBs;

  res.sendStatus(200);
}));

export default router;