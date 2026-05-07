import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";

const HEALTH_URL =
  "https://functions.poehali.dev/bab250b6-9b44-4c92-b8f6-e3d80cd06c33";

const CHECK_INTERVAL_OK = 5 * 60 * 1000;
const CHECK_INTERVAL_FAIL = 60 * 1000;

interface ServiceResult {
  status: "ok" | "degraded" | "down";
  error?: string | null;
}

interface HealthResponse {
  ok: boolean;
  services: Record<string, ServiceResult>;
}

function getIssueText(services: Record<string, ServiceResult>): string {
  const down = Object.entries(services)
    .filter(([, v]) => v.status !== "ok")
    .map(([name]) => name);

  if (down.length === 0) return "";
  if (down.length === 1) return `Сбои у поставщика ${down[0]} — часть функций может работать с перебоями`;
  return `Сбои у поставщиков ${down.join(", ")} — часть функций может работать с перебоями`;
}

export function ServiceStatusBanner() {
  const [message, setMessage] = useState<string>("");
  const [visible, setVisible] = useState(false);

  const check = useCallback(async () => {
    try {
      const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) return;
      const data: HealthResponse = await res.json();
      if (data.ok) {
        setVisible(false);
        setMessage("");
      } else {
        const text = getIssueText(data.services);
        setMessage(text);
        setVisible(true);
      }
    } catch {
      // не показываем баннер при ошибке самой проверки
    }
  }, []);

  useEffect(() => {
    check();
    let interval: ReturnType<typeof setInterval>;

    const schedule = () => {
      clearInterval(interval);
      const delay = visible ? CHECK_INTERVAL_FAIL : CHECK_INTERVAL_OK;
      interval = setInterval(() => {
        check();
        schedule();
      }, delay);
    };

    schedule();
    return () => clearInterval(interval);
  }, [check, visible]);

  if (!visible || !message) return null;

  return (
    <div className="w-full bg-red-500 text-white text-sm font-body font-medium px-4 py-2 flex items-center justify-center gap-2 z-50">
      <Icon name="AlertTriangle" size={16} className="flex-shrink-0" />
      <span className="text-center leading-tight">{message}</span>
    </div>
  );
}
