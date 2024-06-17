import { randomBytes, pbkdf2Sync } from "node:crypto";

export class Password {
  static getSalt(): string {
    return randomBytes(16).toString('hex');
  }

  static hash(password: string, salt: string): string {
    return pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
  }
}