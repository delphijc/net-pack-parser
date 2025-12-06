import type { FileChainOfCustodyEvent } from '../types';

const DB_NAME = 'NetworkParserDB';
const DB_VERSION = 1;
const STORE_NAME = 'fileChainOfCustodyEvents';

class ChainOfCustodyDb {
  private db: IDBDatabase | null = null;
  private _dbPromise: Promise<void>;

  constructor() {
    this._dbPromise = this.initDb();
  }

  private initDb(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        // Already initialized
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
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
    await this._dbPromise; // Ensure DB is initialized
    if (!this.db) {
      throw new Error('IndexedDB is not initialized after promise resolution.');
    }
    const transaction = this.db.transaction(STORE_NAME, mode);
    return transaction.objectStore(STORE_NAME);
  }

  public async addFileChainOfCustodyEvent(
    event: FileChainOfCustodyEvent,
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getObjectStore('readwrite');
        const request = store.add(event);

        request.onsuccess = () => {
          console.log('File Chain of Custody event added:', event);
          resolve();
        };

        request.onerror = (event) => {
          console.error(
            'Error adding file chain of custody event:',
            (event.target as IDBRequest).error,
          );
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public async getAllFileChainOfCustodyEvents(): Promise<
    FileChainOfCustodyEvent[]
  > {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getObjectStore('readonly');
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result as FileChainOfCustodyEvent[]);
        };

        request.onerror = (event) => {
          console.error(
            'Error getting all file chain of custody events:',
            (event.target as IDBRequest).error,
          );
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public async clearAll(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await this.getObjectStore('readwrite');
        const request = store.clear();

        request.onsuccess = () => {
          console.log('All File Chain of Custody events cleared.');
          resolve();
        };

        request.onerror = (event) => {
          console.error(
            'Error clearing all file chain of custody events:',
            (event.target as IDBRequest).error,
          );
          reject((event.target as IDBRequest).error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new ChainOfCustodyDb();
