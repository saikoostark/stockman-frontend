"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface MarketSnapshotQuote {
  instrument_id: string;
  symbol: string;
  price: string;
  currency: string;
  source_at: string;
  received_at: string;
  observation_id: string;
  provider: string;
  data_mode: string;
  delay_seconds: number;
  stale: boolean;
}

export interface StreamEvent {
  kind: string;
  payload: Record<string, unknown>;
}

const RECONNECT_DELAY_MS = 3000;

/**
 * Connects to the authenticated SSE stream at /api/v1/events/ using cookies.
 * Handles Last-Event-ID resume, resync, revision changes and heartbeat.
 * On resync or an authorization-revision change, invalidates the affected
 * TanStack Query caches and reconnects.
 */
export function useEventStream() {
  const queryClient = useQueryClient();
  const lastEventId = useRef<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const connectRef = useRef<() => void>(() => {});

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["capabilities"] });
    queryClient.invalidateQueries({ queryKey: ["wallets"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["fills"] });
    queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["instruments"] });
  }, [queryClient]);

  const connect = useCallback(() => {
    if (sourceRef.current) sourceRef.current.close();

    const source = new EventSource("/api/v1/events/", { withCredentials: true });
    sourceRef.current = source;

    source.onopen = () => {
      // Optionally re-fetch snapshots after a reconnect.
      queryClient.invalidateQueries({ queryKey: ["instruments"] });
    };

    const handler = (kind: string) => (event: MessageEvent) => {
      if (event.lastEventId) lastEventId.current = event.lastEventId;
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(event.data ?? "{}");
      } catch {
        // Non-JSON events (e.g. resync still carries JSON; ignore malformed).
        return;
      }
      switch (kind) {
        case "resync":
          invalidate();
          break;
        case "ready":
          invalidate();
          break;
        case "market.snapshot":
          queryClient.setQueryData(["market-snapshot"], payload);
          break;
        case "notification.created":
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          break;
        case "order.changed":
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["fills"] });
          queryClient.invalidateQueries({ queryKey: ["portfolio"] });
          queryClient.invalidateQueries({ queryKey: ["wallets"] });
          break;
        default:
          if (kind.startsWith("wallet") || kind.startsWith("funding")) {
            queryClient.invalidateQueries({ queryKey: ["wallets"] });
          }
      }
    };

    ["resync", "ready", "market.snapshot", "notification.created", "order.changed"].forEach(
      (kind) => source.addEventListener(kind, handler(kind) as EventListener),
    );
    source.addEventListener("message", handler("message") as EventListener);

    source.onerror = () => {
      source.close();
      sourceRef.current = null;
      window.setTimeout(() => connectRef.current(), RECONNECT_DELAY_MS);
    };
  }, [invalidate, queryClient]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [connect]);

  return { lastEventId };
}
