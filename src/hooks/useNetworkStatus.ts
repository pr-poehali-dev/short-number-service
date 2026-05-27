import { useState, useEffect, useRef, useCallback } from "react";

const PROBE_URL = "/manifest.json";
const PROBE_TIMEOUT_MS = 4000;
const CHECK_INTERVAL_MS = 15000;

async function probeServer(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`${PROBE_URL}?_=${Date.now()}`, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

export type NetworkStatus = "online" | "offline" | "checking";

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>("checking");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    const reachable = await probeServer();
    setStatus(reachable ? "online" : "offline");
  }, []);

  const recheck = useCallback(async () => {
    setStatus("checking");
    const reachable = await probeServer();
    setStatus(reachable ? "online" : "offline");
  }, []);

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, CHECK_INTERVAL_MS);

    const handleOnline = () => check();
    const handleOffline = () => setStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [check]);

  return { status, recheck };
}