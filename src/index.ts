import { getAppDataSource } from "./server/data-source";
// import { User } from "./entity/User";
import { Script } from "./shared/script";

async function main() {
  const appDataSource = await getAppDataSource();
  await appDataSource.initialize();

  // console.log("Inserting a new user into the database...");
  // const user = new User();
  // user.firstName = "Timber";
  // user.lastName = "Saw";
  // user.age = 25;
  // await appDataSource.manager.save(user);
  // console.log("Saved a new user with id: " + user.id);

  // console.log("Loading users from the database...");
  // const users = await appDataSource.manager.find(User);
  // console.log("Loaded users: ", users);

  // console.log("You can setup and run express / fastify / any other framework.");
  
  const script = `
    BEGIN;

    CREATE TABLE
    
    IF NOT EXISTS "user" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "firstName" VARCHAR NOT NULL, "lastName" VARCHAR NOT NULL, "age" INTEGER NOT NULL);
      INSERT INTO user
      VALUES (1, 'Timber', 'Saw', 25);
    
    CREATE TABLE
    
    IF NOT EXISTS "query-result-cache" ("id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, "identifier" VARCHAR, "time" BIGINT NOT NULL, "duration" INTEGER NOT NULL, "query" TEXT NOT NULL, "result" TEXT NOT NULL);
      DELETE
      FROM sqlite_sequence;
    
    INSERT INTO sqlite_sequence
    VALUES ('user', 1);

    CREATE TABLE IF NOT EXISTS "variables" ("id" varchar PRIMARY KEY NOT NULL, "value" text NOT NULL);

    INSERT OR REPLACE INTO variables
    VALUES ("isWAL", 1);
    
    COMMIT;
  `;
  console.log(JSON.stringify(new Script({script}).statements, null, 2));
}
main();