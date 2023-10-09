import express from 'express';
import asyncHandler from 'express-async-handler';
import { Services } from './services';
import { User } from '../objects/user';

const router = express.Router({ mergeParams: true });

router.get('/users', asyncHandler(async (req: any, res: any) => {
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
    const isSingle = req.query.ID || req.query.name;
    if (isSingle) {
      const user = await Services.User.get({
        session: sessionUser,
        arg: {
          ID: parseInt(req.query.ID) || undefined,
          name: req.query.name,
        }
      });
      res.status(200).send(user.toObject());

      return;
    }

    const users = await Services.User.getAll(sessionUser);
    res.status(200).send(users.map((user) => user.toObject()));
  } catch (error) {
    res.sendStatus(403);
  }
}));

router.post('/users', asyncHandler(async (req: any, res: any) => {
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
    const user = await Services.User.add({
      session: sessionUser,
      arg: req.body
    });

    res.status(200).send(user.toObject());
  } catch (error) {
    res.sendStatus(403);
  }
}));

router.put('/users', asyncHandler(async (req: any, res: any) => {
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
    const user = await Services.User.set({
      session: sessionUser,
      arg: {
        ID: parseInt(req.body.ID),
        name: req.body.name,
        password: req.body.password,
        salt: req.body.salt,
      }
    });

    res.status(200).send(user.toObject());
  } catch (error) {
    res.sendStatus(403);
  }
}));

router.delete('/users', asyncHandler(async (req: any, res: any) => {  
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
    await Services.User.del({
      session: sessionUser,
      arg: {
        ID: parseInt(req.query.ID) || undefined,
        name: req.query.name,
      }
    });

    res.sendStatus(200)
  } catch (error) {
    res.sendStatus(403);
  }
}));

export default router;