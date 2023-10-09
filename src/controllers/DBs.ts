import express from 'express';
import asyncHandler from 'express-async-handler';
import { User } from '../objects/user';
import { ZERO } from '../utils/constants';
import { Services } from './services';

const router = express.Router({ mergeParams: true });

router.get('/DBs', asyncHandler(async (req: any, res: any) => {
  /* #region Initialize the session user. */
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  const sessionUser = new User({
    DB: Services.DB.adminDB.DB,
    ...req.session.user
  });
  /* #endregion */

  try {
    const DBs = await Services.DB.getAll({
      user: sessionUser,
      DB: {
        ID: parseInt(req.query.ID) || undefined,
        name: req.query.name,
      }
    });

    const isSingle = req.query.ID || req.query.name;
    if (isSingle && DBs.length > ZERO) {
      res.status(200).send(DBs[0].toObject());
      return;
    }

    res.status(200).send(DBs.map((DB) => DB.toObject()));
  } catch (error) {
    res.sendStatus(403);
  }
}));

router.post('/DBs', asyncHandler(async (req: any, res: any) => {
  /* #region Initialize the session user. */
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  const sessionUser = new User({
    DB: Services.DB.adminDB.DB,
    ...req.session.user
  });
  /* #endregion */

  try {
    const DB = await Services.DB.add({
      user: sessionUser,
      DB: req.body
    });
    res.status(200).send(DB.toObject());
  } catch (error) {
    res.sendStatus(403);
  }
}));

router.put('/DBs', asyncHandler(async (req: any, res: any) => {
  /* #region Initialize the session user. */
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  const sessionUser = new User({
    DB: Services.DB.adminDB.DB,
    ...req.session.user
  });
  /* #endregion */

  try {
    const DB = await Services.DB.set({
      user: sessionUser,
      DB: {
        ID: parseInt(req.body.ID),
        name: req.body.name,
        admins: req.body.admins,
        users: req.body.users,
      }
    });
    res.status(200).send(DB.toObject());
  } catch (error) {
    res.sendStatus(403);
  }
}));

router.delete('/DBs', asyncHandler(async (req: any, res: any) => {
  /* #region Initialize the session user. */
  if (!req.session.user) {
    res.sendStatus(401);
    return;
  }

  const sessionUser = new User({
    DB: Services.DB.adminDB.DB,
    ...req.session.user
  });
  /* #endregion */

  try {
    await Services.DB.del({
      user: sessionUser,
      DB: {
        ID: parseInt(req.query.ID) || undefined,
        name: req.query.name,
      }
    });
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(403);
  }
}));

export default router;