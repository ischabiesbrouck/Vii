import Dexie, { type Table } from 'dexie';

export interface KvRow {
  key: string;
  version: string;
  value: string;
}

/** Local IndexedDB. Holds only derived data (the search index); safe to clear. */
class ConciliumDb extends Dexie {
  kv!: Table<KvRow, string>;
  constructor() {
    super('concilium');
    this.version(1).stores({ kv: 'key' });
  }
}

export const db = new ConciliumDb();
