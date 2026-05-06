import { useState, useCallback } from "react";

const STORAGE_KEY = "advice_limit";
const FREE_LIMIT = 1;
const SUBSCRIBER_LIMIT = 2;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface AdviceLimitState {
  count: number;
  isSubscriber: boolean;
  lastUsedAt: number | null;
}

function load(): AdviceLimitState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") ?? { count: 0, isSubscriber: false, lastUsedAt: null };
  } catch {
    return { count: 0, isSubscriber: false, lastUsedAt: null };
  }
}

function save(state: AdviceLimitState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type AdviceGateResult = "ok" | "show_subscribe" | "show_plans";

export function useAdviceLimit() {
  const [state, setState] = useState<AdviceLimitState>(load);

  const check = useCallback((): AdviceGateResult => {
    const s = load();

    // Сброс счётчика если прошло 24 часа
    if (s.lastUsedAt && Date.now() - s.lastUsedAt > COOLDOWN_MS) {
      const reset = { ...s, count: 0, lastUsedAt: null };
      save(reset);
      setState(reset);
      return "ok";
    }

    const limit = s.isSubscriber ? SUBSCRIBER_LIMIT : FREE_LIMIT;

    if (s.count < limit) return "ok";
    if (!s.isSubscriber) return "show_subscribe";
    return "show_plans";
  }, []);

  const consume = useCallback(() => {
    const s = load();
    const next = { ...s, count: s.count + 1, lastUsedAt: Date.now() };
    save(next);
    setState(next);
  }, []);

  const confirmSubscriber = useCallback(() => {
    const s = load();
    const next = { ...s, isSubscriber: true, count: 0, lastUsedAt: null };
    save(next);
    setState(next);
  }, []);

  const cooldownMs = (): number => {
    const s = load();
    if (!s.lastUsedAt) return 0;
    const remaining = COOLDOWN_MS - (Date.now() - s.lastUsedAt);
    return Math.max(0, remaining);
  };

  return { state, check, consume, confirmSubscriber, cooldownMs };
}
