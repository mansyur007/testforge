import { EventEmitter } from "node:events";

// L-04: in-process pub/sub for real-time run execution (SSE fan-out +
// presence). SINGLE-INSTANCE SCOPE: one Next.js process = one bus — exactly
// what the Docker deploy runs. A multi-instance deploy would need Redis
// pub/sub behind these same two exports (publishRunEvent/subscribeRun);
// out of scope for now, noted for later.
//
// Stored on globalThis so the bus and presence maps survive dev HMR — the
// same trick as the Prisma client singleton in src/lib/db.ts. Presence is
// deliberately NOT persisted: restart = empty map, clients repopulate on
// their next heartbeat.

export type RunEvent =
  | {
      type: "result";
      resultId: string;
      caseId: string;
      datasetName: string | null;
      status: string;
      comment: string | null;
      elapsedSeconds: number | null;
      by: { id: string; name: string };
      at: string;
    }
  | {
      type: "presence";
      users: { id: string; name: string; caseId: string | null; since: string }[];
    };

type PresenceEntry = {
  name: string;
  caseId: string | null;
  since: string;
  lastSeen: number;
};

const store = globalThis as unknown as {
  __tfRunEvents?: EventEmitter;
  __tfRunPresence?: Map<string, Map<string, PresenceEntry>>;
  __tfRunSweep?: ReturnType<typeof setInterval>;
};

const bus = store.__tfRunEvents ?? new EventEmitter();
bus.setMaxListeners(0);
store.__tfRunEvents = bus;

const presence = store.__tfRunPresence ?? new Map<string, Map<string, PresenceEntry>>();
store.__tfRunPresence = presence;

const STALE_MS = 60_000;

// Sweep: drop entries not heartbeated for 60 s (a killed tab whose beacon
// never fired) and tell that run's subscribers.
if (!store.__tfRunSweep) {
  store.__tfRunSweep = setInterval(() => {
    const now = Date.now();
    presence.forEach((users, runId) => {
      let changed = false;
      users.forEach((entry, userId) => {
        if (now - entry.lastSeen > STALE_MS) {
          users.delete(userId);
          changed = true;
        }
      });
      if (users.size === 0) presence.delete(runId);
      if (changed) publishRunEvent(runId, presenceSnapshot(runId));
    });
  }, 30_000);
  store.__tfRunSweep.unref?.();
}

export function publishRunEvent(runId: string, evt: RunEvent): void {
  bus.emit(runId, evt);
}

export function subscribeRun(
  runId: string,
  fn: (evt: RunEvent) => void
): () => void {
  bus.on(runId, fn);
  return () => bus.off(runId, fn);
}

export function presenceSnapshot(runId: string): RunEvent {
  const users = presence.get(runId);
  return {
    type: "presence",
    users: users
      ? Array.from(users, ([id, e]) => ({
          id,
          name: e.name,
          caseId: e.caseId,
          since: e.since,
        }))
      : [],
  };
}

export function heartbeat(
  runId: string,
  user: { id: string; name: string },
  caseId: string | null
): void {
  let users = presence.get(runId);
  if (!users) {
    users = new Map();
    presence.set(runId, users);
  }
  const prev = users.get(user.id);
  users.set(user.id, {
    name: user.name,
    caseId,
    since: prev?.since ?? new Date().toISOString(),
    lastSeen: Date.now(),
  });
  publishRunEvent(runId, presenceSnapshot(runId));
}

export function leave(runId: string, userId: string): void {
  const users = presence.get(runId);
  if (!users?.delete(userId)) return;
  if (users.size === 0) presence.delete(runId);
  publishRunEvent(runId, presenceSnapshot(runId));
}
