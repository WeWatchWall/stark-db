import { getAppDataSource } from "./server/data-source";
import { User } from "./entity/user";

async function main() {
  const appDataSource = await getAppDataSource();
  await appDataSource.initialize();

  console.log("Inserting a new user into the database...");
  const user = new User({
    userName: "Timber",
    password: "Saw",
    salt: "25"
  });
  await appDataSource.manager.save(user);
  console.log("Saved a new user with id: " + user.id);

  console.log("Loading users from the database...");
  const usersQuery = appDataSource.createQueryBuilder(User, "user").select().where("user.firstName = :firstName", { firstName: "Timber" });

  const usersQueryRaw = usersQuery.getQueryAndParameters();
  console.log("usersQueryRaw", usersQueryRaw);

  let users = await usersQuery.getMany();
  console.log("Loaded users: ", users);

  users = await appDataSource.manager.find(User);
  console.log("Loaded users: ", users);

  console.log("You can setup and run express / fastify / any other framework.");
}
main();