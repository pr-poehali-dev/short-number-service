import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";

export interface BannerSettings {
  enabled: string;
  type: string;
  title: string;
  text: string;
  button_label: string;
  button_url: string;
  interval_hours: string;
}

const STORAGE_KEY = "promo_banner_dismissed_at";

function isDismissed(intervalHours: number): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    const elapsed = (Date.now() - dismissedAt) / 1000 / 3600;
    return elapsed < intervalHours;
  } catch {
    return false;
  }
}

function dismiss() {
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

interface Props {
  section: "directory" | "nearby";
}

export default function PromoBanner({ section }: Props) {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch(NEARBY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "get_banner" }),
    })
      .then((r) => r.json())
      .then((data: BannerSettings) => {
        setSettings(data);
        if (data.enabled === "true") {
          const hours = parseFloat(data.interval_hours) || 24;
          setVisible(!isDismissed(hours));
        }
      })
      .catch(() => {});
  }, []);

  if (!settings || !visible) return null;

  function handleClose() {
    dismiss();
    setVisible(false);
  }

  const isSubscribe = settings.type === "subscribe";

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
          <Icon name={isSubscribe ? "Bell" : "Megaphone"} size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground text-sm leading-snug mb-1">
            {settings.title}
          </p>
          <p className="text-xs font-body text-muted-foreground leading-relaxed mb-3">
            {settings.text}
          </p>
          <a
            href={settings.button_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name={isSubscribe ? "ExternalLink" : "ArrowRight"} size={13} />
            {settings.button_label}
          </a>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50 font-body mt-2 text-right">
        {section === "directory" ? "Справочник" : "Быстрый ответ"} · реклама
      </p>
    </div>
  );
}
