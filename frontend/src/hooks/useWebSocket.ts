import { useEffect, useRef, useState } from "react";
import { WS_BASE_URL } from "../api/client";

// onMessage runs for every single message, unlike lastMessage, where two
// messages arriving before React re-renders collapse into the latest one.
// Use it for feeds that send each item only once (e.g. /ws/jobs events).
export function useWebSocket<T = unknown>(path: string | null, onMessage?: (message: T) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const [lastMessage, setLastMessage] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!path) return;

    const ws = new WebSocket(`${WS_BASE_URL}${path}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as T;
        setLastMessage(message);
        onMessageRef.current?.(message);
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      ws.close();
    };
  }, [path]);

  return { lastMessage, connected };
}
