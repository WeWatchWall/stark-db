/* #region Validation is class-name dependent! */
class Entity {
  constructor(attrs: any) {
    Object.assign(this, attrs);
  }
}

export class AdminDB extends Entity { }
export class DB extends Entity { }
export class User extends Entity { }
/* #endregion */