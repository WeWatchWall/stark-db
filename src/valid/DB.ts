import { defineAbility } from '@casl/ability';
import { DBOp } from '../utils/DBOp';
import { Entities } from '../utils/entities';

export default function defineAbilityForDB(user: any) {
  return defineAbility((can) => {
    if (user.isLoggedIn) {
      can(DBOp.Admin, Entities.AdminDB, { admins: { $all: [user.ID] } });
      can(DBOp.Use, Entities.AdminDB, { admins: { $all: [user.ID] } });

      can(DBOp.Admin, Entities.DB, { admins: { $all: [user.ID] } });
      can(DBOp.Use, Entities.DB, { admins: { $all: [user.ID] } });
      can(DBOp.Use, Entities.DB, { users: { $all: [user.ID] } });
    }
  });
}