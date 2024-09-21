import { expect } from "chai";
import { createPinia } from "pinia";
import proxyquire from "proxyquire";
import * as sinon from "sinon";
import { createApp } from "vue";

import { useOptionsStore } from "../../../src/stores/options";

describe("SQLiteDB", () => {
  let db: any;
  let openStub: sinon.SinonStub;
  let unlinkSyncStub: sinon.SinonStub;
  let renameSyncStub: sinon.SinonStub;
  let optionsStore: ReturnType<typeof useOptionsStore>;

  beforeEach(() => {
    unlinkSyncStub = sinon.stub();
    renameSyncStub = sinon.stub();
    const fsMock = {
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

  it("should initialize correctly", () => {
    expect(db.name).to.equal("testDB");
  });

  it("should create a new database file on add", async () => {
    await db.add();
    expect(openStub.calledOnce).to.be.true;
    expect(openStub.firstCall.args[0].filename).to.equal("./test/data/testDB.sqlite");
  });

  it("should delete the database file on delete", () => {
    db.delete();
    expect(unlinkSyncStub.calledOnce).to.be.true;
    expect(unlinkSyncStub.firstCall.args[0]).to.equal("./test/data/testDB.sqlite");
  });

  it("should rename the database file on set", () => {
    db.set("newName");
    expect(renameSyncStub.calledOnce).to.be.true;
    expect(renameSyncStub.firstCall.args[0]).to.equal("./test/data/testDB.sqlite");
    expect(renameSyncStub.firstCall.args[1]).to.equal("./test/data/newName.sqlite");
    expect(db.name).to.equal("newName");
  });
});