import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import Icon from "@/components/ui/icon";

export default function OfflineBanner() {
  const { status, recheck } = useNetworkStatus();

  if (status !== "offline") return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon name="WifiOff" size={18} className="shrink-0" />
        <span className="text-sm font-body font-medium leading-tight">
          Нет связи с сервером — активирован офлайн-режим. Справочник и экстренные номера доступны.
        </span>
      </div>
      <button
        onClick={recheck}
        className="shrink-0 flex items-center gap-1.5 text-xs font-body font-semibold bg-white/20 hover:bg-white/30 transition-colors rounded-lg px-2.5 py-1.5 whitespace-nowrap"
      >
        <Icon name="RefreshCw" size={13} />
        Проверить
      </button>
    </div>
  );
}
