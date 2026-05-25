import { useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import Icon from "@/components/ui/icon";

export default function OfflineBanner() {
  const { status, recheck } = useNetworkStatus();
  const [collapsed, setCollapsed] = useState(false);
  const [lastResult, setLastResult] = useState<"fail" | null>(null);

  if (status === "online") return null;

  async function handleRecheck() {
    setLastResult(null);
    await recheck();
    if (status === "offline") setLastResult("fail");
  }

  const isChecking = status === "checking";

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1.5 bg-amber-500 text-white text-xs font-body font-semibold px-3 py-1.5 rounded-full shadow-lg"
      >
        <Icon name="WifiOff" size={13} />
        Офлайн-режим
      </button>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 shadow-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon name="WifiOff" size={18} className="shrink-0" />
          <span className="text-sm font-body font-medium leading-tight">
            Нет связи с сервером — активирован офлайн-режим. Справочник и экстренные номера доступны.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRecheck}
            disabled={isChecking}
            className="flex items-center gap-1.5 text-xs font-body font-semibold bg-white/20 hover:bg-white/30 disabled:opacity-70 transition-colors rounded-lg px-2.5 py-1.5 whitespace-nowrap"
          >
            <Icon
              name="RefreshCw"
              size={13}
              className={isChecking ? "animate-spin" : ""}
            />
            {isChecking ? "Проверяю..." : "Проверить"}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-1.5"
            title="Свернуть"
          >
            <Icon name="ChevronUp" size={15} />
          </button>
        </div>
      </div>
      {lastResult === "fail" && (
        <p className="text-xs font-body text-white/80 mt-1.5 flex items-center gap-1">
          <Icon name="AlertCircle" size={12} />
          Сервер недоступен или нет интернета — попробуйте позже
        </p>
      )}
    </div>
  );
}
