import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

const HEALTH_URL =
  "https://functions.poehali.dev/bab250b6-9b44-4c92-b8f6-e3d80cd06c33";

interface Incident {
  service: string;
  status: "degraded" | "down";
  http_code: number | null;
  response_ms: number | null;
  error: string | null;
  checked_at: string;
}

interface ServiceResult {
  status: "ok" | "degraded" | "down";
  http_code: number | null;
  response_ms: number | null;
  error: string | null;
}

interface PollSettings {
  interval_active: number;
  interval_new: number;
}

interface HealthResponse {
  ok: boolean;
  enabled: boolean;
  services: Record<string, ServiceResult>;
  incidents: Incident[];
  poll_settings: PollSettings;
  checked_at: string;
}

interface ServiceStat {
  name: string;
  calls_30d: number;
  avg_ms: number;
  total_seconds: number;
}

interface EndpointStat {
  endpoint: string;
  calls_30d: number;
}

interface Stats {
  service_health: {
    calls_30d: number;
    real_response_seconds: number;
    by_service: ServiceStat[];
  };
  other_functions: EndpointStat[];
}

const ENDPOINT_LABELS: Record<string, string> = {
  nearby: "Поиск рядом",
  "analyze-bookmarks": "AI-анализ закладок",
  "send-suggestion": "Предложения",
  "nearby-ai": "Поиск рядом (AI)",
};

const ENDPOINT_TIMEOUTS: Record<string, number> = {
  nearby: 30,
  "analyze-bookmarks": 30,
  "send-suggestion": 30,
  "nearby-ai": 30,
};

function StatusBadge({ status }: { status: string }) {
  if (status === "ok")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
        Работает
      </span>
    );
  if (status === "degraded")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
        Сбои
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Недоступен
    </span>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function exportCsv(incidents: Incident[]) {
  const BOM = "\uFEFF";
  const header = ["Время (UTC+3)", "Сервис", "Статус", "HTTP-код", "Отклик (мс)", "Ошибка"];
  const rows = incidents.map((inc) => [
    formatDate(inc.checked_at),
    inc.service,
    inc.status === "degraded" ? "Сбои" : "Недоступен",
    inc.http_code ?? "",
    inc.response_ms ?? "",
    inc.error ?? "",
  ]);
  const csv =
    BOM +
    [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `incidents-2407-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function IntervalSelect({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground font-body">{label}</p>
        <p className="text-xs text-muted-foreground font-body">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="text-sm font-body border border-border rounded-lg px-2 py-1.5 bg-white text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const INTERVAL_OPTIONS = [
  { value: 1, label: "1 мин" },
  { value: 2, label: "2 мин" },
  { value: 5, label: "5 мин" },
  { value: 10, label: "10 мин" },
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 60, label: "1 час" },
];

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
      setError(e instanceof Error ? e.message : "Ошибка запроса");
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

  const totalHealthCallsEstimate = stats
    ? stats.service_health.calls_30d * 30
    : null;

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

      {/* Enable / Disable toggle */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-body ${enabled ? "bg-green-50 border-green-200" : "bg-muted border-border"}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500" : "bg-muted-foreground"}`} />
          <div>
            <p className="text-sm font-medium text-foreground">
              Мониторинг {enabled ? "включён" : "отключён"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? "Сервисы проверяются при каждом обновлении вкладки"
                : "Проверки не выполняются, вычислительное время не расходуется"}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleToggle(!enabled)}
          disabled={toggling || loading}
          className={`flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-body font-medium transition-colors disabled:opacity-50 ${
            enabled
              ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          <Icon name={toggling ? "Loader" : enabled ? "PowerOff" : "Power"} size={14} className={toggling ? "animate-spin" : ""} />
          {enabled ? "Отключить" : "Включить"}
        </button>
      </div>

      {/* Poll interval settings */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
            <Icon name="Timer" size={15} />
            Частота автообновления вкладки
          </h3>
        </div>
        <div className="px-4 divide-y divide-border">
          <IntervalSelect
            label="Когда мониторинг включён"
            description="Вкладка обновляет данные с этим интервалом, пока мониторинг активен"
            value={localIntervalActive}
            onChange={setLocalIntervalActive}
            options={INTERVAL_OPTIONS}
          />
          <IntervalSelect
            label="Когда мониторинг отключён"
            description="Вкладка обновляет кэшированные данные с этим интервалом"
            value={localIntervalNew}
            onChange={setLocalIntervalNew}
            options={INTERVAL_OPTIONS}
          />
        </div>
        <div className="px-4 py-3 border-t border-border flex justify-end">
          <button
            onClick={handleSavePollSettings}
            disabled={savingPoll}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-body font-medium disabled:opacity-50"
          >
            <Icon name={savingPoll ? "Loader" : "Save"} size={14} className={savingPoll ? "animate-spin" : ""} />
            Сохранить
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
              <Icon name="BarChart2" size={15} />
              Потребление вычислительного времени — последние 30 дней
            </h3>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold font-display text-foreground">
                {stats.service_health.calls_30d.toLocaleString("ru-RU")}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">проверок сервисов</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold font-display text-foreground">
                {Math.round((totalHealthCallsEstimate ?? 0) / 3600)} ч
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">макс. вычисл. времени</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-xl font-bold font-display text-foreground">
                {stats.service_health.real_response_seconds.toLocaleString("ru-RU")} с
              </p>
              <p className="text-xs text-muted-foreground font-body mt-0.5">реальное время ответов</p>
            </div>
          </div>

          {/* Per-service breakdown */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide mb-2">Мониторинг по сервисам</p>
            <div className="space-y-2">
              {stats.service_health.by_service.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm font-body">
                  <span className="text-foreground font-medium">{s.name}</span>
                  <div className="flex items-center gap-4 text-muted-foreground text-xs">
                    <span>{s.calls_30d.toLocaleString("ru-RU")} вызовов</span>
                    <span>~{s.avg_ms} мс/запрос</span>
                    <span className="text-foreground font-medium">{s.total_seconds} с суммарно</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other functions */}
          {stats.other_functions.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground font-body uppercase tracking-wide mb-2">Другие функции (из rate-limit лога)</p>
              <div className="space-y-2">
                {stats.other_functions.map((f) => (
                  <div key={f.endpoint} className="flex items-center justify-between text-sm font-body">
                    <span className="text-foreground font-medium">
                      {ENDPOINT_LABELS[f.endpoint] ?? f.endpoint}
                    </span>
                    <div className="flex items-center gap-4 text-muted-foreground text-xs">
                      <span>{f.calls_30d.toLocaleString("ru-RU")} вызовов</span>
                      <span>таймаут {ENDPOINT_TIMEOUTS[f.endpoint] ?? 30} с</span>
                      <span className="text-foreground font-medium">
                        макс. {Math.round(f.calls_30d * (ENDPOINT_TIMEOUTS[f.endpoint] ?? 30) / 3600 * 10) / 10} ч
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-body">
          <Icon name="AlertCircle" size={16} />
          {error}
        </div>
      )}

      {/* Current status */}
      {data && Object.keys(data.services).length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
              <Icon name="Activity" size={15} />
              Текущий статус
              {!enabled && (
                <span className="text-xs text-muted-foreground font-normal ml-1">(последние известные данные)</span>
              )}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(data.services).map(([name, svc]) => (
              <div key={name} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={svc.status} />
                  <span className="font-body font-medium text-foreground text-sm">{name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-body flex-shrink-0">
                  {svc.http_code && <span>HTTP {svc.http_code}</span>}
                  {svc.response_ms != null && <span>{svc.response_ms} мс</span>}
                  {svc.error && (
                    <span className="text-red-600 max-w-xs truncate" title={svc.error}>
                      {svc.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Incidents log */}
      {data && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
              <Icon name="ClipboardList" size={15} />
              История инцидентов
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-body">
                {data.incidents.length} записей
              </span>
              {data.incidents.length > 0 && (
                <button
                  onClick={() => exportCsv(data.incidents)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body"
                >
                  <Icon name="Download" size={12} />
                  CSV
                </button>
              )}
            </div>
          </div>

          {data.incidents.length === 0 ? (
            <div className="px-4 py-10 text-center text-muted-foreground font-body text-sm">
              <Icon name="ShieldCheck" size={32} className="mx-auto mb-2 opacity-30" />
              Инцидентов не зафиксировано
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border bg-muted/20">
                    <th className="px-4 py-2 text-left font-medium">Время</th>
                    <th className="px-4 py-2 text-left font-medium">Сервис</th>
                    <th className="px-4 py-2 text-left font-medium">Статус</th>
                    <th className="px-4 py-2 text-left font-medium">HTTP</th>
                    <th className="px-4 py-2 text-left font-medium">Отклик</th>
                    <th className="px-4 py-2 text-left font-medium">Ошибка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.incidents.map((inc, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(inc.checked_at)}</td>
                      <td className="px-4 py-2 text-foreground font-medium">{inc.service}</td>
                      <td className="px-4 py-2">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{inc.http_code ?? "-"}</td>
                      <td className="px-4 py-2 text-muted-foreground">{inc.response_ms ?? "-"} мс</td>
                      <td className="px-4 py-2 text-red-600 text-xs max-w-xs truncate" title={inc.error || ""}>
                        {inc.error ?? "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}