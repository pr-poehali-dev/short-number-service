import { useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import Icon from "@/components/ui/icon";

export default function OfflineBanner() {
  const { status, recheck } = useNetworkStatus();
  const [collapsed, setCollapsed] = useState(false);

  if (status !== "offline") return null;

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
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon name="WifiOff" size={18} className="shrink-0" />
        <span className="text-sm font-body font-medium leading-tight">
          Нет связи с сервером — активирован офлайн-режим. Справочник и экстренные номера доступны.
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={recheck}
          className="flex items-center gap-1.5 text-xs font-body font-semibold bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-2.5 py-1.5 whitespace-nowrap"
        >
          <Icon name="RefreshCw" size={13} />
          Проверить
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
  );
}
