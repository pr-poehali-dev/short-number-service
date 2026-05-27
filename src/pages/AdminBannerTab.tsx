import { useState } from "react";
import Icon from "@/components/ui/icon";
import { BANNER_SETTINGS, resetAllBannerDismiss, resetBannerDismiss, type BannerSection } from "@/components/PromoBanner";

const SECTION_LABELS: Record<BannerSection, string> = {
  home: "Главная страница",
  directory: "Справочник",
  nearby: "Быстрый ответ",
  faq: "FAQ",
};

const SECTIONS: BannerSection[] = ["home", "directory", "nearby", "faq"];

export default function AdminBannerTab() {
  const [resetDone, setResetDone] = useState<BannerSection | "all" | null>(null);

  function handleResetAll() {
    resetAllBannerDismiss();
    setResetDone("all");
    setTimeout(() => setResetDone(null), 2500);
  }

  function handleResetOne(section: BannerSection) {
    resetBannerDismiss(section);
    setResetDone(section);
    setTimeout(() => setResetDone(null), 2500);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Баннеры</h2>
            <p className="text-sm text-muted-foreground font-body mt-1 max-w-lg">
              Настройки баннеров хранятся в коде. Чтобы изменить текст или тип — отредактируй константу{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">BANNER_SETTINGS</code>{" "}
              в файле <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">src/components/PromoBanner.tsx</code>.
            </p>
          </div>
          <button
            onClick={handleResetAll}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-body font-medium hover:bg-muted/60 transition-colors"
          >
            {resetDone === "all" ? (
              <><Icon name="Check" size={15} className="text-green-500" /> Сброшено</>
            ) : (
              <><Icon name="RotateCcw" size={15} /> Сбросить показы у всех</>
            )}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((section) => {
          const cfg = BANNER_SETTINGS[section];
          return (
            <div key={section} className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.enabled ? "bg-green-400" : "bg-border"}`} />
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">{SECTION_LABELS[section]}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">
                      {cfg.enabled ? "Включён" : "Выключен"} · {cfg.type === "subscribe" ? "Подписка" : "Промо"} · каждые {cfg.interval_hours} ч.
                    </p>
                    <p className="text-sm text-foreground font-body mt-2 font-medium">{cfg.title}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{cfg.text}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleResetOne(section)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-body font-medium hover:bg-muted/60 transition-colors"
                  title="Сбросить показ для этого раздела"
                >
                  {resetDone === section ? (
                    <><Icon name="Check" size={13} className="text-green-500" /> Сброшено</>
                  ) : (
                    <><Icon name="RotateCcw" size={13} /> Сбросить</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-muted/40 rounded-2xl border border-border p-5">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            Сброс показов работает только для текущего браузера. Баннеры скрываются пользователем на его устройстве — сервер в этом не участвует.
          </p>
        </div>
      </div>
    </div>
  );
}
