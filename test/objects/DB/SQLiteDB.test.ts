import { expect } from "chai";
import { createPinia } from "pinia";
import proxyquire from "proxyquire";
import * as sinon from "sinon";
import { createApp } from "vue";

import { useOptionsStore } from "../../../src/stores/options";

describe("SQLiteDB", () => {
  let db: any;
  let openStub: sinon.SinonStub;
  let existsSyncStub: sinon.SinonStub;
  let unlinkSyncStub: sinon.SinonStub;
  let renameSyncStub: sinon.SinonStub;
  let optionsStore: ReturnType<typeof useOptionsStore>;

  beforeEach(() => {
    existsSyncStub = sinon.stub();
    unlinkSyncStub = sinon.stub();
    renameSyncStub = sinon.stub();
    const fsMock = {
      existsSync: existsSyncStub,
      unlinkSync: unlinkSyncStub,
      renameSync: renameSyncStub,
    };

    openStub = sinon.stub().resolves({ close: sinon.stub().resolves() } as any);
    const { SQLiteDB } = proxyquire("../../../src/objects/DB/SQLiteDB", {
      fs: fsMock,
      sqlite: {
        open: openStub,
      },
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

  it("ctor: should initialize correctly", () => {
    expect(db.name).to.equal("testDB");
  });

  it('get: should return false if the database file does not exist', async function() {
    existsSyncStub.returns(false);

    const result = await db.get();
    expect(result).to.be.false;
  });

  it('get: should return true if the database file exists and can be opened', async function() {
    existsSyncStub.returns(true);
    openStub.resolves({
      close: sinon.stub().resolves()
    });

    const result = await db.get();
    expect(result).to.be.true;
  });

  it('get: should return false if there is an error opening the database file', async function() {
    existsSyncStub.returns(true);
    openStub.rejects(new Error('Failed to open'));

    const result = await db.get();
    expect(result).to.be.false;
  });

  it("add: should create a new database file", async () => {
    await db.add();
    expect(openStub.calledOnce).to.be.true;
    expect(openStub.firstCall.args[0].filename).to.equal("./test/data/testDB.sqlite");
  });

  it("delete: should delete the database file", () => {
    db.delete();
    expect(unlinkSyncStub.calledOnce).to.be.true;
    expect(unlinkSyncStub.firstCall.args[0]).to.equal("./test/data/testDB.sqlite");
  });

  it("set: should rename the database file", () => {
    db.set("newName");
    expect(renameSyncStub.calledOnce).to.be.true;
    expect(renameSyncStub.firstCall.args[0]).to.equal("./test/data/testDB.sqlite");
    expect(renameSyncStub.firstCall.args[1]).to.equal("./test/data/newName.sqlite");
    expect(db.name).to.equal("newName");
  });
});