import { expect } from "chai";
import { Client } from "pg";
import sinon from "sinon";
import { PGDB } from "../../../src/objects/DB/PGDB";
import { useOptionsStore } from "../../../src/stores/options";
import { createPinia } from "pinia";
import { createApp } from "vue";

describe("PGDB", () => {
  let db: any;
  let clientStub: sinon.SinonStubbedInstance<Client>;
  let optionsStore: ReturnType<typeof useOptionsStore>;

  beforeEach(() => {
    const pinia = createPinia();
    const app = createApp({});
    app.use(pinia);

    clientStub = sinon.createStubInstance(Client);
    optionsStore = useOptionsStore();
    optionsStore.engine = "PostgreSQL";
    optionsStore.pguser = "postgres";
    optionsStore.pghost = "localhost";
    optionsStore.pgpassword = "postgres";
    optionsStore.pgport = 5432;

    db = new PGDB({ name: "testdb" });
    db.client = clientStub as unknown as Client;
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should create a new database", async () => {
    await db.add();

    expect(clientStub.connect.calledOnce).to.be.true;
    expect(clientStub.query.calledWith(`CREATE DATABASE testdb`)).to.be.true;
    expect(clientStub.end.calledOnce).to.be.true;
  });

  it("should delete an existing database", async () => {
    await db.delete();

    expect(clientStub.connect.calledOnce).to.be.true;
    expect(clientStub.query.calledWith(`DROP DATABASE testdb`)).to.be.true;
    expect(clientStub.end.calledOnce).to.be.true;
  });

  it("should rename an existing database", async () => {
    await db.set("newtestdb");

    expect(clientStub.connect.calledOnce).to.be.true;
    expect(clientStub.query.calledWith(`ALTER DATABASE testdb RENAME TO newtestdb`)).to.be.true;
    expect(clientStub.end.calledOnce).to.be.true;

    expect(db.name).to.equal("newtestdb");
  });
});