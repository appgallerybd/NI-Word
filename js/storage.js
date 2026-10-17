const DB = (() => {
  let db;
  const open = () => db ? Promise.resolve(db) : new Promise((res, rej) => {
    const r = indexedDB.open('word-editor', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('docs', { keyPath: 'id' });
    r.onsuccess = () => res(db = r.result);
    r.onerror = () => rej(r.error);
  });
  const run = (mode, fn) => open().then(d => new Promise((res, rej) => {
    const q = fn(d.transaction('docs', mode).objectStore('docs'));
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  }));
  return {
    all: () => run('readonly', s => s.getAll()),
    get: id => run('readonly', s => s.get(id)),
    put: doc => run('readwrite', s => s.put(doc)),
    del: id => run('readwrite', s => s.delete(id))
  };
})();
