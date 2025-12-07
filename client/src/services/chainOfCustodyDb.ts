import type { ChainOfCustodyEvent } from '../types';

const DB_NAME = 'NetworkParserDB';
const DB_VERSION = 2; // Increment version for new schema if needed, though we might reuse store if compatible
const STORE_NAME = 'chainOfCustodyEvents'; // Renaming store usually requires migration. Let's keep it simple or handle upgrade.

// To avoid migration complexity in this prompt, we will use a new store name and version bump.
// Existing data might be lost unless migrated, but for dev assumption this is acceptable.

class ChainOfCustodyDb {
  private db: IDBDatabase | null = null;
  private _dbPromise: Promise<void>;

  constructor() {
    this._dbPromise = this.initDb();
  }

  private initDb(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create new store if not exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        // Ideally we would migrate old 'fileChainOfCustodyEvents' here,
        // but let's assume fresh start or parallel existence.
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB opened successfully for Chain of Custody.');
        resolve();
      };

      request.onerror = (event) => {
        console.error(
          'IndexedDB error:',
          (event.target as IDBOpenDBRequest).error,
        );
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  private async getObjectStore(
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore> {
    await this._dbPromise;
    if (!this.db) {
      throw new Error('IndexedDB is not initialized.');
    }
    const transaction = this.db.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  }

  public async addEvent(event: ChainOfCustodyEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const store = await this.getObjectStore('readwrite');
          const request = store.add(event);

          request.onsuccess = () => {
            console.log('Chain of Custody event added:', event);
            resolve();
          };

          request.onerror = (event) => {
            console.error(
              'Error adding event:',
              (event.target as IDBRequest).error,
            );
            reject((event.target as IDBRequest).error);
          };
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  public async getAllEvents(): Promise<ChainOfCustodyEvent[]> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const store = await this.getObjectStore('readonly');
          const request = store.getAll();

          request.onsuccess = () => {
            resolve(request.result as ChainOfCustodyEvent[]);
          };

          request.onerror = (event) => {
            console.error(
              'Error getting events:',
              (event.target as IDBRequest).error,
            );
            reject((event.target as IDBRequest).error);
          };
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  public async clearAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const store = await this.getObjectStore('readwrite');
          const request = store.clear();

          request.onsuccess = () => {
            console.log('All Chain of Custody events cleared.');
            resolve();
          };

          request.onerror = (event) => {
            reject((event.target as IDBRequest).error);
          };
        } catch (error) {
          reject(error);
        }
      })();
    });
  }
}

export default new ChainOfCustodyDb();
