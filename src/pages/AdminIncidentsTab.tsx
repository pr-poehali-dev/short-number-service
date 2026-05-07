import { useState, useEffect, useCallback } from "react";
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

interface HealthResponse {
  ok: boolean;
  services: Record<string, ServiceResult>;
  incidents: Incident[];
  checked_at: string;
}

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

export function AdminIncidentsTab() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: HealthResponse = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-foreground text-lg">Мониторинг сервисов</h2>
          {lastRefresh && (
            <p className="text-xs text-muted-foreground font-body mt-0.5">
              Обновлено: {formatDate(lastRefresh.toISOString())}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body disabled:opacity-50"
        >
          <Icon name={loading ? "Loader" : "RefreshCw"} size={14} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-body">
          <Icon name="AlertCircle" size={16} />
          {error}
        </div>
      )}

      {/* Current status */}
      {data && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
              <Icon name="Activity" size={15} />
              Текущий статус
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
            <span className="text-xs text-muted-foreground font-body">
              {data.incidents.length} записей
            </span>
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
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inc.checked_at)}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {inc.service}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={inc.status} />
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {inc.http_code ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {inc.response_ms != null ? `${inc.response_ms} мс` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-red-600 max-w-xs truncate text-xs" title={inc.error ?? ""}>
                        {inc.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center text-muted-foreground font-body py-12 text-sm">
          Нет данных
        </div>
      )}
    </div>
  );
}
