import { EventType } from "./EventType";

export class DBEvent {
  id: number; // Primary Key
  type: EventType;

  name: string; // Unique
  enabled: boolean;
  admins: string[];
  readers: string[];
  writers: string[];
}