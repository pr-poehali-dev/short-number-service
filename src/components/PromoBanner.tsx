import { useState } from "react";
import Icon from "@/components/ui/icon";

export type BannerSection = "home" | "directory" | "nearby" | "faq";

export interface BannerConfig {
  enabled: boolean;
  type: "subscribe" | "promo";
  title: string;
  text: string;
  button_label: string;
  button_url: string;
  interval_hours: number;
}

export const BANNER_SETTINGS: Record<BannerSection, BannerConfig> = {
  home: {
    enabled: true,
    type: "subscribe",
    title: "Полный доступ к справочнику",
    text: "Подпишитесь на новости, чтобы следить за пульсом интернет-сервиса.",
    button_label: "Подписаться",
    button_url: "https://t.me/qrnumber",
    interval_hours: 24,
  },
  directory: {
    enabled: true,
    type: "subscribe",
    title: "Будьте в курсе обновлений",
    text: "Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы",
    button_label: "Подписаться",
    button_url: "https://t.me/qrnumber",
    interval_hours: 24,
  },
  nearby: {
    enabled: true,
    type: "subscribe",
    title: "Будьте в курсе обновлений",
    text: "Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы",
    button_label: "Подписаться",
    button_url: "https://t.me/qrnumber",
    interval_hours: 24,
  },
  faq: {
    enabled: true,
    type: "subscribe",
    title: "Будьте в курсе обновлений",
    text: "Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы",
    button_label: "Подписаться",
    button_url: "https://t.me/qrnumber",
    interval_hours: 24,
  },
};

function storageKey(section: BannerSection) {
  return `promo_banner_dismissed_at_${section}`;
}

function isDismissed(section: BannerSection, intervalHours: number): boolean {
  if (intervalHours <= 0) return false;
  try {
    const raw = localStorage.getItem(storageKey(section));
    if (!raw) return false;
    const elapsed = (Date.now() - parseInt(raw, 10)) / 1000 / 3600;
    return elapsed < intervalHours;
  } catch {
    return false;
  }
}

export function dismissBanner(section: BannerSection) {
  localStorage.setItem(storageKey(section), String(Date.now()));
}

export function resetBannerDismiss(section: BannerSection) {
  localStorage.removeItem(storageKey(section));
}

export function resetAllBannerDismiss() {
  (Object.keys(BANNER_SETTINGS) as BannerSection[]).forEach((s) =>
    localStorage.removeItem(storageKey(s))
  );
}

interface Props {
  section: BannerSection;
}

export default function PromoBanner({ section }: Props) {
  const config = BANNER_SETTINGS[section];
  const [hidden, setHidden] = useState(false);

  if (hidden || !config.enabled || isDismissed(section, config.interval_hours)) return null;

  function handleClose() {
    dismissBanner(section);
    setHidden(true);
  }

  if (config.type === "subscribe") {
    return (
      <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-4 animate-fade-in">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-100 text-muted-foreground hover:text-foreground transition-colors"
          title="Скрыть"
        >
          <Icon name="X" size={14} />
        </button>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-6">
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-foreground mb-1">{config.title}</h3>
            <p className="text-sm text-muted-foreground font-body">{config.text}</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href="https://t.me/qrnumber"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#2AABEE] text-white rounded-xl font-body font-semibold text-sm hover:bg-[#239cd8] transition-colors no-underline"
            >
              <Icon name="Send" size={16} /> Telegram
            </a>
            <a
              href="https://vk.com/qrnumber"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0077FF] text-white rounded-xl font-body font-semibold text-sm hover:bg-[#0066dd] transition-colors no-underline"
            >
              <Icon name="Users" size={16} /> ВКонтакте
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-primary/8 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 animate-fade-in">
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
        title="Скрыть"
      >
        <Icon name="X" size={14} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon name="Megaphone" size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground text-sm leading-snug mb-1">{config.title}</p>
          <p className="text-xs font-body text-muted-foreground leading-relaxed mb-3">{config.text}</p>
          <a
            href={config.button_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="ArrowRight" size={13} />
            {config.button_label}
          </a>
        </div>
      </div>
    </div>
  );
}