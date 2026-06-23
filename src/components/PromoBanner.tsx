import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";
const VOTE_URL = "https://functions.poehali.dev/ab122f27-9496-402b-a89e-b78c74ddbe32";

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

export function clearBannerCache() {
  Object.keys(bannerCache).forEach((k) => delete bannerCache[k]);
}

const ALL_SECTIONS = ["home", "directory", "nearby", "faq"];

export function clearDismissed() {
  ALL_SECTIONS.forEach((s) => {
    localStorage.removeItem(storageKey(s));
    localStorage.removeItem(voteKey(s));
  });
  clearBannerCache();
}

function storageKey(section: string) {
  return `promo_banner_dismissed_at_${section}`;
}

function voteKey(section: string) {
  return `promo_banner_voted_${section}`;
}

function isDismissed(section: string, intervalHours: number): boolean {
  if (intervalHours <= 0) return false;
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

function VoteBanner({ settings, onClose }: { settings: BannerSettings; onClose: () => void }) {
  const [step, setStep] = useState<"vote" | "form" | "done">(() =>
    localStorage.getItem(voteKey("nearby")) === "1" ? "done" : "vote"
  );
  const [count, setCount] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(VOTE_URL).then((r) => r.json()).then((d) => setCount(d.count)).catch(() => {});
  }, []);

  async function handleVote() {
    setStep("form");
  }

  async function handleSubmit() {
    setSending(true);
    try {
      const res = await fetch(VOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const data = await res.json();
      localStorage.setItem(voteKey("nearby"), "1");
      setCount(data.count);
      setStep("done");
    } finally {
      setSending(false);
    }
  }

  function handleSkipComment() {
    handleSubmit();
  }

  return (
    <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-4 animate-fade-in">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-100 text-muted-foreground hover:text-foreground transition-colors"
        title="Скрыть"
      >
        <Icon name="X" size={14} />
      </button>

      {step === "vote" && (
        <div className="pr-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Icon name="MapPin" size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-base leading-snug mb-1">
                {settings.title}
              </h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">
                {settings.text}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleVote}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-body font-semibold text-sm transition-colors"
            >
              <Icon name="ThumbsUp" size={15} />
              Голосую «За»
            </button>
            <a
              href="https://max.ru/id7814535230_biz2"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7B2FF7] to-[#2AABEE] text-white rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity no-underline"
            >
              <Icon name="Zap" size={15} /> MAX
            </a>
            {count !== null && (
              <span className="text-sm text-muted-foreground font-body">
                {count} {count === 1 ? "голос" : count >= 2 && count <= 4 ? "голоса" : "голосов"}
              </span>
            )}
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="pr-6">
          <p className="font-display font-bold text-foreground text-sm mb-1">Расскажите, что важно для вас?</p>
          <p className="text-xs text-muted-foreground font-body mb-3">Ваши мысли помогут нам сделать раздел лучше. Можно пропустить.</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Напишите, что было бы полезно..."
            rows={3}
            className="w-full px-3 py-2.5 border border-amber-200 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 resize-none bg-white mb-3"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-body font-semibold text-sm transition-colors"
            >
              {sending ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
              Отправить
            </button>
            <button
              onClick={handleSkipComment}
              disabled={sending}
              className="px-4 py-2 border border-border bg-white hover:bg-muted/50 text-muted-foreground rounded-xl font-body text-sm transition-colors"
            >
              Пропустить
            </button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="pr-6 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
            <Icon name="Check" size={18} className="text-green-600" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground text-sm mb-0.5">Спасибо за голос!</p>
            <p className="text-xs text-muted-foreground font-body">
              {count !== null ? `Уже ${count} ${count === 1 ? "человек" : count >= 2 && count <= 4 ? "человека" : "человек"} поддержали эту идею.` : "Ваш голос учтён."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
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
        setVisible(!isDismissed(section, parseFloat(data.interval_hours)));
      }
      return;
    }
    fetch(NEARBY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "get_banner", section }),
    })
      .then((r) => r.json())
      .then((data: BannerSettings) => {
        bannerCache[section] = { data, ts: Date.now() };
        setSettings(data);
        if (data.enabled === "true") {
          setVisible(!isDismissed(section, parseFloat(data.interval_hours)));
        }
      })
      .catch(() => {});
  }, [section]);

  if (!settings || !visible) return null;

  function handleClose() {
    dismiss(section);
    setVisible(false);
    if (bannerCache[section]) {
      bannerCache[section].data = { ...bannerCache[section].data, enabled: "false" };
    }
  }

  if (settings.type === "vote") {
    return <VoteBanner settings={settings} onClose={handleClose} />;
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
          <div className="flex gap-3 flex-shrink-0 flex-wrap">
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
            <a
              href="https://max.ru/id7814535230_biz2"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7B2FF7] to-[#2AABEE] text-white rounded-xl font-body font-semibold text-sm hover:opacity-90 transition-opacity no-underline"
            >
              <Icon name="Zap" size={16} /> MAX
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
          <div className="flex items-center gap-2 flex-wrap">
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
            <a
              href="https://max.ru/id7814535230_biz2"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#7B2FF7] to-[#2AABEE] text-white rounded-xl text-xs font-body font-semibold hover:opacity-90 transition-opacity no-underline"
            >
              <Icon name="Zap" size={13} /> MAX
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}