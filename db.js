; (function (win) {
  'use stricct';
  const dbname = 'n-lp';
  const indexedDB = win.indexedDB || win.mozIndexedDB || win.webkitIndexedDB || win.msIndexedDB;
  const IDBTransaction = win.IDBTransaction || win.webkitIDBTransaction || win.msIDBTransaction;
  const IDBKeyRange = win.IDBKeyRange || win.webkitIDBKeyRange || win.msIDBKeyRange;
  const RW = 'readwrite';
  const R = 'readonly';
  let db;
  let dbreq;
  let objStore;

  // promise => {event, store}
  function add2DB(dbContext, table, value) {
    return new Promise(function (resolve, reject) {
      if (!dbContext) throw new Error('invalid db context!');
      if (!table) throw new Error('invalid table param');
      try {
        let tx = dbContext.transaction(table, RW);
        let objectStore = tx.objectStore(table);
        let req = objectStore.add(value);
        req.onerror = function add2DBError(evt) {
          reject(new Error(evt.target.error));
        };
        req.onsuccess = function add2DBSuccess(evt) {
          resolve({ evt: evt, store: objectStore });
        }
      }
      catch (e) {
        reject(e);
      }
    });
  }

  /**
   * @param  {objectStore} store indexedDB table
   * @return {promise} promise => stored data
   */
  function getAllData(store) {
    return new Promise(function (resolve, reject) {
      if (!store) reject(new Error('invalid store param in getAllData func'));
      if (store.getAll) {
        store.getAll().onsuccess = function getAllDataSuccess(evt) {
          resolve(evt.target.result);
        }
      } else {
        let res = []
        store.openCursor().onsuccess = function getAllDataCrsSuccess(evt) {
          let csr = evt.target.result;
          if (csr) {
            res.push(csr.value);
            csr.continue();
          } else {
            resolve(res);
          }
        }
      }
    });
  }

  function fetchOptions() {
    return new Promise(function (resolve) {
      let tx = db.transaction('urls', 'readonly');
      objStore = tx.objectStore('urls');
      objStore.getAll().onsuccess = function (evt) {
        resolve(evt.target.result);
      }
    });
  }

  function del(key) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction('urls', RW);
      const store = tx.objectStore('urls');
      const req = store.delete(key);
      req.onsuccess = function (evt) {
        resolve(evt.target.result);
      }
      req.onerror = function (evt) {
        reject(evt.target.error);
      }
    });
  }

  function connect() {
    return new Promise(function (resolve, reject) {
      dbreq = indexedDB.open(dbname, 1);
      dbreq.onsuccess = function (evt) {
        db = evt.target.result;
        db.onclose = function () {
          console.log('db closed;');
        }
        Object.assign(window._dbUtils_, {
          del: del,
          fetchOptions: fetchOptions,
          getAllData: getAllData,
          add2DB: add2DB.bind(null, db)
        });
        resolve(db);

        // database 中若不存在 urls 表，则报错
        if (!db.objectStoreNames.contains('urls')) {
          alert('db init failed');
          reject('db urls not exisits');
        }
      };
      dbreq.onupgradeneeded = function (evt) {
        db = evt.target.result;
        db.createObjectStore('urls', { keyPath: 'url' });
      };
      dbreq.onerror = function (evt) { reject('step1 error'); };
    });
  }

  window._dbUtils_ = { connect: connect };
})(window);
