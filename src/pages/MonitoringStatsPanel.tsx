import Icon from "@/components/ui/icon";
import { Stats, ENDPOINT_LABELS, ENDPOINT_TIMEOUTS } from "./incidents.types";

interface MonitoringStatsPanelProps {
  stats: Stats;
}

export function MonitoringStatsPanel({ stats }: MonitoringStatsPanelProps) {
  const totalHealthCallsEstimate = stats.service_health.calls_30d * 30;

  return (
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
            {Math.round(totalHealthCallsEstimate / 3600)} ч
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
  );
}
