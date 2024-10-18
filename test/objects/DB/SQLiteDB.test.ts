import { expect } from "chai";
import { createPinia } from "pinia";
import proxyquire from "proxyquire";
import * as sinon from "sinon";
import { createApp } from "vue";

import { useOptionsStore } from "../../../src/stores/options";
import { SQLiteDB } from "../../../src/objects/DB/SQLiteDB";

describe("SQLiteDB", () => {
  let db: SQLiteDB;
  let DatabaseStub: sinon.SinonStub;
  let existsSyncStub: sinon.SinonStub;
  let unlinkSyncStub: sinon.SinonStub;
  let renameSyncStub: sinon.SinonStub;
  let mkdirSyncStub: sinon.SinonStub;
  let optionsStore: ReturnType<typeof useOptionsStore>;

  beforeEach(() => {
    existsSyncStub = sinon.stub();
    unlinkSyncStub = sinon.stub();
    renameSyncStub = sinon.stub();
    mkdirSyncStub = sinon.stub();
    const fsMock = {
      existsSync: existsSyncStub,
      unlinkSync: unlinkSyncStub,
      renameSync: renameSyncStub,
      mkdirSync: mkdirSyncStub,
    };

    const dbInstanceMock = {
      close: sinon.stub(),
    };
    DatabaseStub = sinon.stub().returns(dbInstanceMock);
    const { SQLiteDB } = proxyquire("../../../src/objects/DB/SQLiteDB", {
      fs: fsMock,
      "better-sqlite3": DatabaseStub,
    });

    const pinia = createPinia();
    const app = createApp({});
    app.use(pinia);

    optionsStore = useOptionsStore();
    optionsStore.engine = "SQLite";
    optionsStore.data = "./test/data";

    db = new SQLiteDB({ name: "testDB" });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("constructor: should set the database name correctly", () => {
    expect(db.name).to.equal("testDB");
  });

  it("get: returns false if the database file does not exist", async () => {
    existsSyncStub.returns(false);

    const result = await db.get();
    expect(result).to.be.false;
    expect(DatabaseStub.notCalled).to.be.true;
  });

  it("get: returns true if the database file exists and can be opened", async () => {
    existsSyncStub.returns(true);

    const result = await db.get();
    expect(result).to.be.true;
    expect(DatabaseStub.calledOnce).to.be.true;
    expect(DatabaseStub.firstCall.args[0]).to.equal("./test/data/testDB");
  });

  it("get: returns false if there is an error opening the database file", async () => {
    existsSyncStub.returns(true);
    DatabaseStub.throws(new Error("Failed to open"));

    const result = await db.get();
    expect(result).to.be.false;
    expect(DatabaseStub.calledOnce).to.be.true;
    expect(DatabaseStub.firstCall.args[0]).to.equal("./test/data/testDB");
  });

  it("add: creates a new database file", async () => {
    existsSyncStub.returns(false);
    await db.add();
    expect(DatabaseStub.calledOnce).to.be.true;
    expect(DatabaseStub.firstCall.args[0]).to.equal("./test/data/testDB");
  });

  it("delete: deletes the database file", () => {
    db.delete();
    expect(unlinkSyncStub.calledOnce).to.be.true;
    expect(unlinkSyncStub.firstCall.args[0]).to.equal("./test/data/testDB");
  });

  it("set: renames the database file", () => {
    db.set("newName");
    expect(renameSyncStub.calledOnce).to.be.true;
    expect(renameSyncStub.firstCall.args[0]).to.equal("./test/data/testDB");
    expect(renameSyncStub.firstCall.args[1]).to.equal("./test/data/newName");
    expect(db.name).to.equal("newName");
  });
});