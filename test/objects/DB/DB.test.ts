import { expect } from 'chai';
import sinon from 'sinon';
import { SQLiteDB } from '../../../src/objects/DB/SQLiteDB';
import { PGDB } from '../../../src/objects/DB/PGDB';
import { useOptionsStore } from '../../../src/stores/options';
import { DB } from '../../../src/objects/DB/DB';
import { IDB } from '../../../src/objects/DB/IDB';

describe('DB Class', () => {
  let optionsStoreStub: sinon.SinonStub;
  let sqliteDBStub: sinon.SinonStubbedInstance<SQLiteDB>;

  beforeEach(() => {
    sqliteDBStub = sinon.createStubInstance(SQLiteDB);
    optionsStoreStub = sinon.stub().returns({ engine: 'SQLite' });
    (useOptionsStore as any) = optionsStoreStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Constructor', () => {
    it('should initialize SQLiteDB when engine is SQLite', () => {
      optionsStoreStub.returns({ engine: 'SQLite' });
      const db = new DB({name: "Data"});
      expect(db['db']).to.be.instanceOf(SQLiteDB);
    });

    it('should initialize PGDB when engine is PostgreSQL', () => {
      optionsStoreStub.returns({ engine: 'PostgreSQL' });
      const db = new DB({name: "Data"});
      expect(db['db']).to.be.instanceOf(PGDB);
    });

    it('should throw error for unsupported engine', () => {
      optionsStoreStub.returns({ engine: 'Unknown' });
      expect(() => new DB({name: "Data"})).to.throw('Unsupported database engine');
    });
  });

  describe('name property', () => {
    it('should get the name from the underlying db', () => {
      const dbInstance = new DB({name: "Data"});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.name = 'TestDB';

      expect(dbInstance.name).to.equal('TestDB');
    });

    it('should set the name on the underlying db', () => {
      const dbInstance = new DB({name: "Data"});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;

      dbInstance.name = 'NewName';
      expect(sqliteDBStub.name).to.equal('NewName');
    });
  });

  describe('get method', () => {
    it('should call get on the underlying db', async () => {
      const dbInstance = new DB({name: 'Data'});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(true);

      const result = await dbInstance.get();
      expect(result).to.equal(true);
      expect(sqliteDBStub.get.calledOnce).to.be.true;
    });
  });

  describe('add method', () => {
    it('should throw error if db already exists', async () => {
      const dbInstance = new DB({name: 'Data'});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(true);

      try {
        await dbInstance.add();
      } catch (error: any) {
        expect(error.message).to.equal('Database already exists');
      }
    });

    it('should call add on the underlying db if db does not exist', async () => {
        const dbInstance = new DB({name: "Data"});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(false);

      await dbInstance.add();
      expect(sqliteDBStub.add.calledOnce).to.be.true;
    });
  });

  describe('delete method', () => {
    it('should throw error if db does not exist', async () => {
      const dbInstance = new DB({name: "Data"});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(false);

      try {
        await dbInstance.delete();
      } catch (error: any) {
        expect(error.message).to.equal('Database does not exist');
      }
    });

    it('should call delete on the underlying db if db exists', async () => {
      const dbInstance = new DB({name: 'Data'});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(true);

      await dbInstance.delete();
      expect(sqliteDBStub.delete.calledOnce).to.be.true;
    });
  });

  describe('set method', () => {
    it('should throw error if db does not exist', async () => {
      const dbInstance = new DB({name: 'Data'});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(false);

      try {
        await dbInstance.set('NewName');
      } catch (error: any) {
        expect(error.message).to.equal('Database does not exist');
      }
    });

    it('should call set on the underlying db if db exists', async () => {
      const dbInstance = new DB({name: 'Data'});
      dbInstance['db'] = sqliteDBStub as unknown as IDB;
      sqliteDBStub.get.resolves(true);

      await dbInstance.set('NewName');
      expect(sqliteDBStub.set.calledOnceWith('NewName')).to.be.true;
    });
  });
});