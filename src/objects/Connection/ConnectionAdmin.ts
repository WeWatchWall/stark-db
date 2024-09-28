import { DB_ADMIN_NAME } from "../../utils/constants";
import { ConnectionBase } from "./ConnectionBase";

export class ConnectionAdmin extends ConnectionBase {
  constructor() {
    super(DB_ADMIN_NAME);
  }
}