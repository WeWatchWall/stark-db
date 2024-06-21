import { defineAbility } from '@casl/ability';
import { CRUD } from '../utils/CRUD';
import { Entities } from '../utils/entities';

export default function defineAbilityForUser(user: any, isAdmin: boolean) {
  return defineAbility((can, cannot) => {
    if (isAdmin) {
      can(CRUD.Create, Entities.User);
      can(CRUD.Read, Entities.User);
      can(CRUD.Update, Entities.User);
      can(CRUD.Delete, Entities.User);
    } else {
      cannot(CRUD.Create, Entities.User);
      can(CRUD.Read, Entities.User, { ID: user.ID });
      can(CRUD.Update, Entities.User, { ID: user.ID });
      can(CRUD.Delete, Entities.User, { ID: user.ID });
    }
  });
}