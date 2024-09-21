import * as sinon from "sinon";
import proxyquire from "proxyquire";
import { expect } from "chai";

describe("SQLiteDB", () => {
  let db: any;
  let openStub: sinon.SinonStub;
  let unlinkSyncStub: sinon.SinonStub;
  let renameSyncStub: sinon.SinonStub;

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

    db = new SQLiteDB({ name: "testDB" });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should initialize correctly", () => {
    expect(db.name).to.equal("testDB");
    expect(db.path).to.be.undefined;
  });

  it("should create a new database file on add", async () => {
    await db.add();
    expect(openStub.calledOnce).to.be.true;
    expect(openStub.firstCall.args[0].filename).to.equal("testDB.sqlite");
  });

  it("should delete the database file on delete", () => {
    db.delete();
    expect(unlinkSyncStub.calledOnce).to.be.true;
    expect(unlinkSyncStub.firstCall.args[0]).to.equal("testDB.sqlite");
  });

  it("should rename the database file on set", () => {
    db.set("newName");
    expect(renameSyncStub.calledOnce).to.be.true;
    expect(renameSyncStub.firstCall.args[0]).to.equal("testDB.sqlite");
    expect(renameSyncStub.firstCall.args[1]).to.equal("newName.sqlite");
    expect(db.name).to.equal("newName");
  });
});