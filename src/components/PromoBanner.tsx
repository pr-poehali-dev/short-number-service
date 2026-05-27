import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 5000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (_) { /* retry */ }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  throw new Error("fetch failed after retries");
}

export interface BannerSettings {
  enabled: string;
  type: string;
  title: string;
  text: string;
  button_label: string;
  button_url: string;
  interval_hours: string;
}

const BANNER_CACHE_TTL = 10 * 60 * 1000;
const bannerCache: Record<string, { data: BannerSettings; ts: number }> = {};

function storageKey(section: string) {
  return `promo_banner_dismissed_at_${section}`;
}

function isDismissed(section: string, intervalHours: number): boolean {
  try {
    const raw = localStorage.getItem(storageKey(section));
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    const elapsed = (Date.now() - dismissedAt) / 1000 / 3600;
    return elapsed < intervalHours;
  } catch {
    return false;
  }
}

function dismiss(section: string) {
  localStorage.setItem(storageKey(section), String(Date.now()));
}

interface Props {
  section: "home" | "directory" | "nearby" | "faq";
}

export default function PromoBanner({ section }: Props) {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cached = bannerCache[section];
    if (cached && Date.now() - cached.ts < BANNER_CACHE_TTL) {
      const data = cached.data;
      setSettings(data);
      if (data.enabled === "true") {
        setVisible(!isDismissed(section, parseFloat(data.interval_hours) || 24));
      }
      return;
    }
    fetchWithRetry(NEARBY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "get_banner", section }),
    })
      .then((r) => r.json())
      .then((data: BannerSettings) => {
        bannerCache[section] = { data, ts: Date.now() };
        setSettings(data);
        if (data.enabled === "true") {
          setVisible(!isDismissed(section, parseFloat(data.interval_hours) || 24));
        }
      })
      .catch(() => {});
  }, [section]);

  if (!settings || !visible) return null;

  function handleClose() {
    dismiss(section);
    setVisible(false);
  }

  const isSubscribe = settings.type === "subscribe";

  if (isSubscribe) {
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
            <h3 className="font-display text-lg font-bold text-foreground mb-1">{settings.title}</h3>
            <p className="text-sm text-muted-foreground font-body">{settings.text}</p>
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
            <Icon name="ArrowRight" size={13} />
            {settings.button_label}
          </a>
        </div>
      </div>
    </div>
  );
}