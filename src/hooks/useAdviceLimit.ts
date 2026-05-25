import { useState, useCallback } from "react";

const STORAGE_KEY = "advice_limit";
const FREE_LIMIT = 1;
const SUBSCRIBER_LIMIT = 2;
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC+3

interface AdviceLimitState {
  count: number;
  isSubscriber: boolean;
  usedOnDay: string | null; // дата в МСК "YYYY-MM-DD"
}

/** Текущая дата в МСК в формате "YYYY-MM-DD" */
function mskToday(): string {
  const now = new Date(Date.now() + MSK_OFFSET_MS);
  return now.toISOString().slice(0, 10);
}

/** Миллисекунды до полуночи МСК */
function msUntilMskMidnight(): number {
  const nowMsk = Date.now() + MSK_OFFSET_MS;
  const dayMs = 24 * 60 * 60 * 1000;
  return dayMs - (nowMsk % dayMs);
}

function load(): AdviceLimitState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw) return { count: 0, isSubscriber: false, usedOnDay: null };
    // Миграция старого формата (lastUsedAt → usedOnDay)
    if ("lastUsedAt" in raw && !("usedOnDay" in raw)) {
      return { count: 0, isSubscriber: raw.isSubscriber ?? false, usedOnDay: null };
    }
    return raw;
  } catch {
    return { count: 0, isSubscriber: false, usedOnDay: null };
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
    const today = mskToday();

    // Сброс если наступил новый день по МСК
    if (s.usedOnDay !== today) {
      const reset = { ...s, count: 0, usedOnDay: today };
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
    const next = { ...s, count: s.count + 1, usedOnDay: mskToday() };
    save(next);
    setState(next);
  }, []);

  const confirmSubscriber = useCallback(() => {
    const s = load();
    const next = { ...s, isSubscriber: true, count: 0, usedOnDay: null };
    save(next);
    setState(next);
  }, []);

  const cooldownMs = (): number => {
    const s = load();
    if (!s.usedOnDay || s.usedOnDay !== mskToday()) return 0;
    return msUntilMskMidnight();
  };

  return { state, check, consume, confirmSubscriber, cooldownMs };
}