"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RunEvent } from "@/lib/run-events";

export type ResultEvent = Extract<RunEvent, { type: "result" }>;
export type PresenceUser = {
  id: string;
  name: string;
  caseId: string | null;
  since: string;
};

const RETRY_MS = [1000, 2000, 5000, 5000, 5000];
const HEARTBEAT_MS = 20_000;

// A remount is not a leave. React StrictMode — on by default for the app router
// under `next dev`, which is what the e2e suite runs against — mounts every
// effect, tears it down and mounts it again back-to-back. The teardown used to
// fire the leave beacon unconditionally, so one plain page load sent the server
// four independent requests: heartbeat, heartbeat, LEAVE, heartbeat. Each one
// awaits `getSession()` and a membership query before it touches the presence
// map, so the order they *land* in is decided by whichever pair of promises
// resolves first, not by the order they were sent — and the beacon is the one
// request the browser is free to deprioritize. Whenever LEAVE landed last it
// deleted a session that was very much alive, and nothing put it back until the
// next heartbeat 20 s later: long enough for the other tab to never see the
// avatar (TC-*-48 in e2e/realtime-run.spec.ts, CI run 31605455201).
//
// So the unmount leave is deferred by one task and cancelled if the same run
// mounts again, which is precisely what a remount does — React runs the
// teardown and the second mount synchronously, with no turn of the event loop
// between them for the timer to fire in. A genuine unmount has no such remount,
// so the leave goes out on the very next task. `pagehide` still leaves
// immediately: a closing tab has no next task to run it in.
const pendingLeave = new Map<string, ReturnType<typeof setTimeout>>();

// L-04: EventSource subscription + presence heartbeat for one run. Realtime
// is an OVERLAY — the executor must behave byte-identically when this hook
// reports connected: false (no EventSource support, SSE blocked, or after
// 5 failed retries it goes silent for good; degradation must be invisible).
export function useRunChannel(
  runId: string,
  {
    selfId,
    enabled = true,
    onResult,
  }: {
    selfId: string;
    enabled?: boolean;
    onResult: (evt: ResultEvent) => void;
  }
): {
  connected: boolean;
  presence: PresenceUser[];
  reportCase: (caseId: string | null) => void;
} {
  const [connected, setConnected] = useState(false);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const caseRef = useRef<string | null>(null);

  const beat = useCallback(
    (caseId: string | null) => {
      fetch(`/api/runs/${runId}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      }).catch(() => {
        /* presence is best-effort */
      });
    },
    [runId]
  );

  const reportCase = useCallback(
    (caseId: string | null) => {
      if (caseId === caseRef.current) return;
      caseRef.current = caseId;
      beat(caseId);
    },
    [beat]
  );

  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;

    // Whatever teardown we are (re)mounting from was not a leave after all.
    clearTimeout(pendingLeave.get(runId));
    pendingLeave.delete(runId);

    let source: EventSource | null = null;
    let failures = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      source = new EventSource(`/api/runs/${runId}/events`);
      source.onopen = () => {
        failures = 0;
        setConnected(true);
      };
      source.onmessage = (msg) => {
        let evt: RunEvent;
        try {
          evt = JSON.parse(msg.data);
        } catch {
          return;
        }
        if (evt.type === "presence") setPresence(evt.users);
        else if (evt.type === "result" && evt.by.id !== selfId)
          onResultRef.current(evt);
      };
      source.onerror = () => {
        source?.close();
        setConnected(false);
        if (failures >= RETRY_MS.length) return; // give up silently, per AC
        retryTimer = setTimeout(connect, RETRY_MS[failures]);
        failures += 1;
      };
    };
    connect();

    const heartbeat = setInterval(() => beat(caseRef.current), HEARTBEAT_MS);
    beat(caseRef.current);

    const sendLeave = () => {
      navigator.sendBeacon?.(
        `/api/runs/${runId}/presence`,
        JSON.stringify({ leave: true })
      );
    };
    const onPagehide = () => {
      clearTimeout(pendingLeave.get(runId));
      pendingLeave.delete(runId);
      sendLeave();
    };
    window.addEventListener("pagehide", onPagehide);

    return () => {
      disposed = true;
      window.removeEventListener("pagehide", onPagehide);
      clearInterval(heartbeat);
      clearTimeout(retryTimer);
      source?.close();
      setConnected(false);
      // Leaving the page component counts as leaving the run — but only once
      // it's clear this is an unmount and not a remount (see `pendingLeave`).
      pendingLeave.set(
        runId,
        setTimeout(() => {
          pendingLeave.delete(runId);
          sendLeave();
        }, 0)
      );
    };
  }, [runId, selfId, enabled, beat]);

  return { connected, presence, reportCase };
}
