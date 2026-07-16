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

    const onPagehide = () => {
      navigator.sendBeacon?.(
        `/api/runs/${runId}/presence`,
        JSON.stringify({ leave: true })
      );
    };
    window.addEventListener("pagehide", onPagehide);

    return () => {
      disposed = true;
      window.removeEventListener("pagehide", onPagehide);
      clearInterval(heartbeat);
      clearTimeout(retryTimer);
      source?.close();
      setConnected(false);
      onPagehide(); // leaving the page component counts as leaving the run
    };
  }, [runId, selfId, enabled, beat]);

  return { connected, presence, reportCase };
}
