import { expect } from "chai";
import { Client } from "pg";
import sinon from "sinon";
import { PGDB } from "../../../src/objects/DB/PGDB";
import { useOptionsStore } from "../../../src/stores/options";
import { createPinia } from "pinia";
import { createApp } from "vue";

describe("PGDB", () => {
  let clientStub: sinon.SinonStubbedInstance<Client>;
  let optionsStore: ReturnType<typeof useOptionsStore>;

  beforeEach(() => {
    const pinia = createPinia();
    const app = createApp({});
    app.use(pinia)

    clientStub = sinon.createStubInstance(Client);
    optionsStore = useOptionsStore();
    optionsStore.engine = "PostgreSQL";
    optionsStore.pguser = "postgres";
    optionsStore.pghost = "localhost";
    optionsStore.pgpassword = "postgres";
    optionsStore.pgport = 5432;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should create a new database", async () => {
    const pgdb = new PGDB({ name: "testdb" });
    pgdb.client = clientStub as unknown as Client;

    await pgdb.add();

    expect(clientStub.connect.calledOnce).to.be.true;
    expect(clientStub.query.calledWith(`CREATE DATABASE testdb`)).to.be.true;
    expect(clientStub.end.calledOnce).to.be.true;
  });

  it("should delete an existing database", async () => {
    const pgdb = new PGDB({ name: "testdb" });
    pgdb.client = clientStub as unknown as Client;

    await pgdb.delete();

    expect(clientStub.connect.calledOnce).to.be.true;
    expect(clientStub.query.calledWith(`DROP DATABASE testdb`)).to.be.true;
    expect(clientStub.end.calledOnce).to.be.true;
  });

  it("should rename an existing database", async () => {
    const pgdb = new PGDB({ name: "testdb" });
    pgdb.client = clientStub as unknown as Client;

    await pgdb.set("newtestdb");

    expect(clientStub.connect.calledOnce).to.be.true;
    expect(clientStub.query.calledWith(`ALTER DATABASE testdb RENAME TO newtestdb`)).to.be.true;
    expect(clientStub.end.calledOnce).to.be.true;

    expect(pgdb.name).to.equal("newtestdb");
  });
});