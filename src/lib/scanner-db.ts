const DB_NAME = 'ticketsales-scanner';
const DB_VERSION = 1;

export interface ManifestTicket {
  ticketId: string;
  qrCode: string;
  holderName: string;
  tierName: string;
  status: string;
}

export interface PendingScan {
  id: string;
  ticketId: string;
  scannedAt: string;
  deviceId: string;
  gate: string | null;
  result: string;
  holderName: string;
  tierName: string;
}

export interface ScanHistoryEntry {
  id: string;
  ticketId: string;
  holderName: string;
  tierName: string;
  result: string;
  scannedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('manifest')) {
        db.createObjectStore('manifest', { keyPath: 'ticketId' });
      }
      if (!db.objectStoreNames.contains('manifestMeta')) {
        db.createObjectStore('manifestMeta', { keyPath: 'eventId' });
      }
      if (!db.objectStoreNames.contains('pendingScans')) {
        db.createObjectStore('pendingScans', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('scanHistory')) {
        const store = db.createObjectStore('scanHistory', { keyPath: 'id' });
        store.createIndex('scannedAt', 'scannedAt', { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveManifest(
  eventId: string,
  tickets: ManifestTicket[],
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(['manifest', 'manifestMeta'], 'readwrite');
  const store = tx.objectStore('manifest');
  const metaStore = tx.objectStore('manifestMeta');

  // Clear old tickets for this event (simple approach: clear all and re-add)
  store.clear();
  for (const t of tickets) {
    store.put(t);
  }
  metaStore.put({ eventId, savedAt: new Date().toISOString(), count: tickets.length });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getManifest(eventId: string): Promise<ManifestTicket[]> {
  const db = await openDB();
  const tx = db.transaction('manifest', 'readonly');
  const store = tx.objectStore('manifest');
  const req = store.getAll();

  return new Promise((resolve, reject) => {
    req.onsuccess = () => { db.close(); resolve(req.result as ManifestTicket[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function addPendingScan(scan: PendingScan): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('pendingScans', 'readwrite');
  tx.objectStore('pendingScans').put(scan);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getPendingScans(): Promise<PendingScan[]> {
  const db = await openDB();
  const tx = db.transaction('pendingScans', 'readonly');
  const req = tx.objectStore('pendingScans').getAll();

  return new Promise((resolve, reject) => {
    req.onsuccess = () => { db.close(); resolve(req.result as PendingScan[]); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

export async function clearPendingScans(ids: string[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('pendingScans', 'readwrite');
  const store = tx.objectStore('pendingScans');
  for (const id of ids) {
    store.delete(id);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function addScanHistory(entry: ScanHistoryEntry): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('scanHistory', 'readwrite');
  tx.objectStore('scanHistory').put(entry);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

export async function getRecentScans(limit = 20): Promise<ScanHistoryEntry[]> {
  const db = await openDB();
  const tx = db.transaction('scanHistory', 'readonly');
  const store = tx.objectStore('scanHistory');
  const index = store.index('scannedAt');
  const results: ScanHistoryEntry[] = [];

  return new Promise((resolve, reject) => {
    const cursor = index.openCursor(null, 'prev');
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c && results.length < limit) {
        results.push(c.value as ScanHistoryEntry);
        c.continue();
      } else {
        db.close();
        resolve(results);
      }
    };
    cursor.onerror = () => { db.close(); reject(cursor.error); };
  });
}

// Mark a ticket as redeemed in the local manifest cache
export async function markTicketRedeemed(ticketId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('manifest', 'readwrite');
  const store = tx.objectStore('manifest');
  const req = store.get(ticketId);

  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const ticket = req.result as ManifestTicket | undefined;
      if (ticket) {
        ticket.status = 'Redeemed';
        store.put(ticket);
      }
      tx.oncomplete = () => { db.close(); resolve(); };
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}
