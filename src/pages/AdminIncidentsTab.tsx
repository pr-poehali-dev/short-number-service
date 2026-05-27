import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";
import {
  HEALTH_URL,
  HealthResponse,
  Stats,
  formatDate,
} from "./incidents.types";
import { MonitoringStatusPanel } from "./MonitoringStatusPanel";
import { MonitoringPollSettings } from "./MonitoringPollSettings";
import { MonitoringStatsPanel } from "./MonitoringStatsPanel";

export function AdminIncidentsTab() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [toggling, setToggling] = useState(false);
  const [savingPoll, setSavingPoll] = useState(false);

  const [localIntervalActive, setLocalIntervalActive] = useState(5);
  const [localIntervalNew, setLocalIntervalNew] = useState(30);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthResponse = await res.json();
      setData(json);
      setLastRefresh(new Date());
      if (json.poll_settings) {
        const interval = json.enabled
          ? json.poll_settings.interval_active
          : json.poll_settings.interval_new;
        setLocalIntervalActive(json.poll_settings.interval_active);
        setLocalIntervalNew(json.poll_settings.interval_new);
        countdownRef.current = interval * 60;
        setCountdown(interval * 60);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка запроса";
      setError(msg === "Failed to fetch" ? "Не удалось подключиться к серверу мониторинга. Проверьте соединение." : msg);
      countdownRef.current = 60;
      setCountdown(60);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch(HEALTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "get_stats" }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return;
      const json: Stats = await res.json();
      setStats(json);
    } catch (_e) {
      /* stats are optional */
    }
  }, []);

  useEffect(() => {
    load();
    loadStats();
  }, [load, loadStats]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      countdownRef.current -= 1;
      setCountdown(countdownRef.current);
      if (countdownRef.current <= 0) {
        load();
        loadStats();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [load, loadStats]);

  async function handleToggle(enable: boolean) {
    setToggling(true);
    try {
      await fetch(HEALTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "set_enabled", enabled: enable }),
      });
      await load();
    } finally {
      setToggling(false);
    }
  }

  async function handleSavePollSettings() {
    setSavingPoll(true);
    try {
      await fetch(HEALTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _action: "set_poll_settings",
          interval_active: localIntervalActive,
          interval_new: localIntervalNew,
        }),
      });
      await load();
    } finally {
      setSavingPoll(false);
    }
  }

  const enabled = data?.enabled ?? false;

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}м ${sec}с` : `${sec}с`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-foreground text-lg">Мониторинг сервисов</h2>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Обновлено: {formatDate(lastRefresh.toISOString())}
              {countdown > 0 && (
                <span className="ml-2 text-primary">· следующее через {formatCountdown(countdown)}</span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => { load(); loadStats(); }}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body disabled:opacity-50"
        >
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      <MonitoringStatusPanel
        enabled={enabled}
        toggling={toggling}
        loading={loading}
        services={data?.services ?? {}}
        incidents={data?.incidents ?? []}
        onToggle={handleToggle}
      />

      <MonitoringPollSettings
        intervalActive={localIntervalActive}
        intervalNew={localIntervalNew}
        saving={savingPoll}
        onChangeActive={setLocalIntervalActive}
        onChangeNew={setLocalIntervalNew}
        onSave={handleSavePollSettings}
      />

      {stats && <MonitoringStatsPanel stats={stats} />}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-body">
          <Icon name="AlertCircle" size={16} />
          {error}
        </div>
      )}
    </div>
  );
}