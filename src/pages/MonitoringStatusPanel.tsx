import Icon from "@/components/ui/icon";
import { Incident, ServiceResult, formatDate, exportCsv } from "./incidents.types";

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

interface MonitoringStatusPanelProps {
  enabled: boolean;
  toggling: boolean;
  loading: boolean;
  services: Record<string, ServiceResult>;
  incidents: Incident[];
  onToggle: (enable: boolean) => void;
}

export function MonitoringStatusPanel({
  enabled,
  toggling,
  loading,
  services,
  incidents,
  onToggle,
}: MonitoringStatusPanelProps) {
  return (
    <>
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
          onClick={() => onToggle(!enabled)}
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

      {/* Current status */}
      {Object.keys(services).length > 0 && (
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
            {Object.entries(services).map(([name, svc]) => (
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
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
            <Icon name="ClipboardList" size={15} />
            История инцидентов
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-body">
              {incidents.length} записей
            </span>
            {incidents.length > 0 && (
              <button
                onClick={() => exportCsv(incidents)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body"
              >
                <Icon name="Download" size={12} />
                CSV
              </button>
            )}
          </div>
        </div>

        {incidents.length === 0 ? (
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
                {incidents.map((inc, i) => (
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
    </>
  );
}
