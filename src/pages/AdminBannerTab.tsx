import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 3000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
    } catch (_) { /* retry */ }
    if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
  }
  throw new Error("fetch failed after retries");
}

const allBannerCache: Partial<Record<BannerSection, BannerForm>> = {};

type BannerSection = "home" | "directory" | "nearby" | "faq";

interface BannerForm {
  enabled: string;
  type: string;
  title: string;
  text: string;
  button_label: string;
  button_url: string;
  interval_hours: string;
}

const SECTION_LABELS: Record<BannerSection, string> = {
  home: "Главная страница",
  directory: "Справочник",
  nearby: "Быстрый ответ",
  faq: "FAQ",
};

const DEFAULTS: Record<BannerSection, BannerForm> = {
  home: {
    enabled: "true", type: "subscribe",
    title: "Полный доступ к справочнику",
    text: "Подпишитесь на новости, чтобы следить за пульсом интернет-сервиса.",
    button_label: "Подписаться", button_url: "https://t.me/qrnumber", interval_hours: "24",
  },
  directory: {
    enabled: "true", type: "subscribe",
    title: "Будьте в курсе обновлений",
    text: "Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы",
    button_label: "Подписаться", button_url: "https://t.me/qrnumber", interval_hours: "24",
  },
  nearby: {
    enabled: "true", type: "subscribe",
    title: "Будьте в курсе обновлений",
    text: "Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы",
    button_label: "Подписаться", button_url: "https://t.me/qrnumber", interval_hours: "24",
  },
  faq: {
    enabled: "true", type: "subscribe",
    title: "Будьте в курсе обновлений",
    text: "Подписывайтесь на наш Telegram-канал — новые номера, изменения и полезные материалы",
    button_label: "Подписаться", button_url: "https://t.me/qrnumber", interval_hours: "24",
  },
};

function BannerEditor({ section, initialData }: { section: BannerSection; initialData: BannerForm | null }) {
  const [form, setForm] = useState<BannerForm>(initialData ?? DEFAULTS[section]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) setForm(initialData);
  }, [initialData]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const token = sessionStorage.getItem("admin_token") || "";
      await fetch(NEARBY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ _action: "update_banner", section, ...form }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  const f = (key: keyof BannerForm, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Баннер — {SECTION_LABELS[section]}</h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">
              {section === "home" ? "Отображается на главной странице" : section === "faq" ? "Отображается над заголовком раздела FAQ" : `Отображается под блоком «Избранное» в разделе «${SECTION_LABELS[section]}»`}
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-body text-muted-foreground">Включён</span>
            <div
              onClick={() => f("enabled", form.enabled === "true" ? "false" : "true")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${form.enabled === "true" ? "bg-primary" : "bg-border"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.enabled === "true" ? "left-6" : "left-1"}`} />
            </div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Тип баннера</label>
            <div className="flex gap-2">
              {[
                { id: "subscribe", label: "Подписка (Telegram/VK)", icon: "Bell" },
                { id: "promo", label: "Произвольный текст", icon: "Megaphone" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => f("type", t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium border transition-colors ${
                    form.type === t.id ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <Icon name={t.icon as "Bell" | "Megaphone"} size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Заголовок</label>
            <input
              value={form.title}
              onChange={(e) => f("title", e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Текст</label>
            <textarea
              rows={3}
              value={form.text}
              onChange={(e) => f("text", e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            />
          </div>

          {form.type === "promo" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Текст кнопки</label>
                <input
                  value={form.button_label}
                  onChange={(e) => f("button_label", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">URL кнопки</label>
                <input
                  value={form.button_url}
                  onChange={(e) => f("button_url", e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Периодичность показа</label>
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="number"
                min="1"
                max="8760"
                value={form.interval_hours}
                onChange={(e) => f("interval_hours", e.target.value)}
                className="w-28 px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="text-sm font-body text-muted-foreground">часов после закрытия</span>
              <div className="flex gap-2 ml-auto">
                {[{ label: "1 день", val: "24" }, { label: "3 дня", val: "72" }, { label: "7 дней", val: "168" }].map((p) => (
                  <button
                    key={p.val}
                    onClick={() => f("interval_hours", p.val)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium border transition-colors ${
                      form.interval_hours === p.val ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 font-body mt-3">{error}</p>}

        <div className="flex items-center gap-3 mt-6 pt-5 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="Save" size={14} />}
            {saving ? "Сохраняю..." : "Сохранить"}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-body flex items-center gap-1">
              <Icon name="Check" size={14} /> Сохранено
            </span>
          )}
        </div>

        <div className="flex items-start gap-2.5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Icon name="Info" size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs font-body text-amber-800 leading-relaxed">
            Если вы обновили срочное объявление — нажмите <strong>«Сбросить показы у всех»</strong> вверху страницы, чтобы баннер снова показался тем, кто его уже закрывал.
          </p>
        </div>
      </div>

      {/* Превью */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h3 className="font-display font-semibold text-foreground mb-4 text-sm">Превью</h3>
        {form.type === "subscribe" ? (
          <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
            <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-muted-foreground">
              <Icon name="X" size={14} />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pr-6">
              <div className="flex-1">
                <h3 className="font-display text-lg font-bold text-foreground mb-1">{form.title || "Заголовок"}</h3>
                <p className="text-sm text-muted-foreground font-body">{form.text || "Текст баннера"}</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <span className="flex items-center gap-2 px-4 py-2.5 bg-[#2AABEE] text-white rounded-xl font-body font-semibold text-sm">
                  <Icon name="Send" size={16} /> Telegram
                </span>
                <span className="flex items-center gap-2 px-4 py-2.5 bg-[#0077FF] text-white rounded-xl font-body font-semibold text-sm">
                  <Icon name="Users" size={16} /> ВКонтакте
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative bg-gradient-to-br from-primary/8 to-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-muted-foreground">
              <Icon name="X" size={14} />
            </div>
            <div className="flex items-start gap-3 pr-6">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon name="Megaphone" size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-foreground text-sm leading-snug mb-1">{form.title || "Заголовок"}</p>
                <p className="text-xs font-body text-muted-foreground leading-relaxed mb-3">{form.text || "Текст баннера"}</p>
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-body font-semibold">
                  <Icon name="ArrowRight" size={13} />
                  {form.button_label || "Кнопка"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminBannerTab() {
  const [activeSection, setActiveSection] = useState<BannerSection>("home");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [allData, setAllData] = useState<Partial<Record<BannerSection, BannerForm>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function loadAllBanners() {
    setLoading(true);
    setLoadError(false);
    const sections: BannerSection[] = ["home", "directory", "nearby", "faq"];
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const results = await Promise.all(
          sections.map((section) =>
            fetch(NEARBY_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ _action: "get_banner", section }),
            })
              .then((r) => { if (!r.ok) throw new Error("not ok"); return r.json(); })
              .then((data) => ({ section, data: { ...DEFAULTS[section], ...data } as BannerForm }))
          )
        );
        const map: Partial<Record<BannerSection, BannerForm>> = {};
        results.forEach(({ section, data }) => { map[section] = data; });
        setAllData(map);
        setLoading(false);
        return;
      } catch {
        if (attempt < 2) await new Promise(r => setTimeout(r, 3000));
      }
    }
    setLoadError(true);
    setLoading(false);
  }

  useEffect(() => {
    loadAllBanners();
   
  }, []);



  async function handleResetAll() {
    setResetting(true);
    setResetDone(false);
    const token = sessionStorage.getItem("admin_token") || "";
    const sections: BannerSection[] = ["home", "directory", "nearby", "faq"];
    try {
      await Promise.all(
        sections.map((section) =>
          fetchWithRetry(NEARBY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Admin-Token": token },
            body: JSON.stringify({ _action: "update_banner", section, interval_hours: "0" }),
          })
        )
      );
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Icon name="Loader" size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-sm text-red-600 font-body">Не удалось загрузить настройки баннеров</p>
        <button
          onClick={loadAllBanners}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-body text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Icon name="RefreshCw" size={14} /> Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-white border border-border rounded-xl p-1">
          {(["home", "directory", "nearby", "faq"] as BannerSection[]).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-colors ${
                activeSection === s ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {resetDone && (
            <span className="text-sm text-green-600 font-body flex items-center gap-1">
              <Icon name="Check" size={14} /> Сброшено — баннеры снова покажутся всем
            </span>
          )}
          <button
            onClick={handleResetAll}
            disabled={resetting}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-body font-semibold text-sm hover:bg-amber-600 disabled:opacity-60 transition-colors"
          >
            {resetting ? <Icon name="Loader" size={14} className="animate-spin" /> : <Icon name="RefreshCw" size={14} />}
            {resetting ? "Сбрасываю..." : "Сбросить показы у всех"}
          </button>
        </div>
      </div>

      <BannerEditor section={activeSection} initialData={allData[activeSection] ?? null} />
    </div>
  );
}