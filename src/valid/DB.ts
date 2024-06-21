import { defineAbility } from '@casl/ability';
import { DBOp } from '../utils/DBOp';
import { Entities } from '../utils/entities';

export default function defineAbilityForDB(user: any) {
  return defineAbility((can) => {
    if (user.isLoggedIn) {
      // Admin can do anything to the Admin DB.
      can(DBOp.Admin, Entities.AdminDB, { admins: { $all: [user.ID] } });
      can(DBOp.Read, Entities.AdminDB, { admins: { $all: [user.ID] } });
      can(DBOp.Write, Entities.AdminDB, { admins: { $all: [user.ID] } });

      // DB admin can do anything to the DB.
      can(DBOp.Admin, Entities.DB, { admins: { $all: [user.ID] } });
      can(DBOp.Read, Entities.DB, { admins: { $all: [user.ID] } });
      can(DBOp.Write, Entities.DB, { admins: { $all: [user.ID] } });

      // Writer can write to the DB.
      can(DBOp.Read, Entities.DB, { writers: { $all: [user.ID] } });
      can(DBOp.Write, Entities.DB, { writers: { $all: [user.ID] } });

      // Reader can read the DB.
      can(DBOp.Read, Entities.DB, { readers: { $all: [user.ID] } });
    }
  });
}