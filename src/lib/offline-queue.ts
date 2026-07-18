// F-36 Part C: offline result queue — raw IndexedDB, zero dependencies. When a
// result submit can't reach the server (offline / timeout), the executor
// enqueues it here and the queue drains automatically on the next trigger
// (window `online`, tab becoming visible, executor mount, or after any
// successful direct submit). Order matters — the same case can be re-recorded,
// so flush() replays in `recordedAt` order, sequentially.

const DB_NAME = "tf-offline";
const DB_VERSION = 1;
const STORE = "pending";

export type QueuedPayload = {
  status: string;
  comment?: string | null;
  defectUrl?: string | null;
  elapsedSeconds?: number | null;
  clientId: string;
  recordedAt: string; // ISO — when the tester pressed the button (audit truth)
};

export type QueueItem = {
  clientId: string;
  resultId: string;
  payload: QueuedPayload;
  recordedAt: string;
  tries: number;
};

export type Conflict = { theirStatus: string; theirName: string; theirAt: string };

export type FlushHandlers = {
  onConflict?: (conflict: Conflict, item: QueueItem) => void;
  // Dropped permanently (a 4xx that will never succeed — e.g. permission
  // revoked mid-queue). Distinct from a network error, which keeps the item.
  onDrop?: (item: QueueItem, reason: string) => void;
};

const hasIDB = () => typeof indexedDB !== "undefined";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE))
        db.createObjectStore(STORE, { keyPath: "clientId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}

// --- badge subscribers ------------------------------------------------------
const listeners = new Set<(count: number) => void>();
async function emit() {
  const c = await count();
  listeners.forEach((cb) => cb(c));
}

/** Subscribe to queue-size changes (for the header pill / badge). Fires once
 * immediately with the current count; returns an unsubscribe fn. */
export function subscribe(cb: (count: number) => void): () => void {
  listeners.add(cb);
  count().then(cb).catch(() => cb(0));
  return () => listeners.delete(cb);
}

export async function count(): Promise<number> {
  if (!hasIDB()) return 0;
  try {
    return await tx<number>("readonly", (s) => s.count());
  } catch {
    return 0;
  }
}

export async function enqueue(item: Omit<QueueItem, "tries">): Promise<void> {
  if (!hasIDB()) return;
  await tx("readwrite", (s) => s.put({ ...item, tries: 0 }));
  await emit();
}

async function allPending(): Promise<QueueItem[]> {
  if (!hasIDB()) return [];
  const items = await tx<QueueItem[]>("readonly", (s) => s.getAll());
  return items.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

/** The set of resultIds with a pending queued submit — drives the per-row
 * `⟳ queued` chips in the executor. */
export async function pendingResultIds(): Promise<Set<string>> {
  const items = await allPending();
  return new Set(items.map((i) => i.resultId));
}

async function remove(clientId: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(clientId));
}

async function bumpTries(item: QueueItem): Promise<void> {
  await tx("readwrite", (s) => s.put({ ...item, tries: item.tries + 1 }));
}

let flushing = false;

/**
 * Drain the queue in recorded order. Per item: HTTP 2xx → remove (+ surface any
 * reported conflict); HTTP 4xx → drop (it will never succeed); network error →
 * keep and stop (the next trigger retries). Returns the number sent.
 */
export async function flush(handlers: FlushHandlers = {}): Promise<number> {
  if (!hasIDB() || flushing) return 0;
  flushing = true;
  let sent = 0;
  try {
    const items = await allPending();
    for (const item of items) {
      let res: Response;
      try {
        res = await fetch(`/api/runs/results/${item.resultId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
      } catch {
        // Network error — keep the item and stop; a later trigger retries.
        await bumpTries(item);
        break;
      }
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        await remove(item.clientId);
        sent++;
        if (data?.conflict) handlers.onConflict?.(data.conflict, item);
      } else if (res.status >= 400 && res.status < 500) {
        await remove(item.clientId);
        handlers.onDrop?.(item, `HTTP ${res.status}`);
      } else {
        // 5xx: transient server error — keep, retry next flush.
        await bumpTries(item);
        break;
      }
    }
  } finally {
    flushing = false;
    await emit();
  }
  return sent;
}
