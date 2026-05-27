export const HEALTH_URL =
  "https://functions.poehali.dev/bab250b6-9b44-4c92-b8f6-e3d80cd06c33";

export interface Incident {
  service: string;
  status: "degraded" | "down";
  http_code: number | null;
  response_ms: number | null;
  error: string | null;
  checked_at: string;
}

export interface ServiceResult {
  status: "ok" | "degraded" | "down";
  http_code: number | null;
  response_ms: number | null;
  error: string | null;
}

export interface PollSettings {
  interval_active: number;
  interval_new: number;
}

export interface HealthResponse {
  ok: boolean;
  enabled: boolean;
  services: Record<string, ServiceResult>;
  incidents: Incident[];
  poll_settings: PollSettings;
  checked_at: string;
}

export interface ServiceStat {
  name: string;
  calls_30d: number;
  avg_ms: number;
  total_seconds: number;
}

export interface EndpointStat {
  endpoint: string;
  calls_30d: number;
}

export interface Stats {
  service_health: {
    calls_30d: number;
    real_response_seconds: number;
    by_service: ServiceStat[];
  };
  other_functions: EndpointStat[];
}

export const ENDPOINT_LABELS: Record<string, string> = {
  nearby: "Поиск рядом",
  "analyze-bookmarks": "AI-анализ закладок",
  "send-suggestion": "Предложения",
  "nearby-ai": "Поиск рядом (AI)",
};

export const ENDPOINT_TIMEOUTS: Record<string, number> = {
  nearby: 30,
  "analyze-bookmarks": 30,
  "send-suggestion": 30,
  "nearby-ai": 30,
};

export const INTERVAL_OPTIONS = [
  { value: 1, label: "1 мин" },
  { value: 2, label: "2 мин" },
  { value: 5, label: "5 мин" },
  { value: 10, label: "10 мин" },
  { value: 15, label: "15 мин" },
  { value: 30, label: "30 мин" },
  { value: 60, label: "1 час" },
];

export function formatDate(iso: string) {
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

export function exportCsv(incidents: Incident[]) {
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
