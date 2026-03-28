import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NUMBERS, LAST_UPDATED, PhoneNumber } from "./data";

type IconName = Parameters<typeof Icon>[0]["name"];

const SEND_SUGGESTION_URL = "https://functions.poehali.dev/0c640a47-5d45-45cb-901c-c7ba1f48d5ea";

function NumberForm() {
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PhoneNumber | null>(null);
  const [form, setForm] = useState({ number: "", name: "", description: "", procedure: "", category: "" });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const suggestions = mode === "edit" && search.length >= 1
    ? NUMBERS.filter((n) =>
        n.number.includes(search) ||
        n.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 5)
    : [];

  function selectNumber(n: PhoneNumber) {
    setSelected(n);
    setSearch(n.number + " — " + n.name);
    setForm({
      number: n.number,
      name: n.name,
      description: n.description,
      procedure: n.procedure ?? "",
      category: n.category,
    });
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      await fetch(SEND_SUGGESTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, ...form }),
      });
    } finally {
      setLoading(false);
      setShowModal(true);
      setForm({ number: "", name: "", description: "", procedure: "", category: "" });
      setSearch("");
      setSelected(null);
    }
  }

  const isValid = form.number.trim() && form.name.trim() && form.description.trim();

  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-xl flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Icon name="CheckCircle" size={32} className="text-green-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground text-center">Информация отправлена</h3>
            <p className="text-sm text-muted-foreground font-body text-center">Спасибо! Мы рассмотрим вашу заявку в ближайшее время.</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      <h3 className="font-display text-xl font-bold text-foreground mb-1">Добавить номер</h3>
      <p className="text-sm text-muted-foreground font-body mb-4">Добавьте новый номер или исправьте описание существующего</p>

      <div className="flex gap-2 mb-5">
        {(["add", "edit"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelected(null); setSearch(""); setForm({ number: "", name: "", description: "", procedure: "", category: "" }); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-semibold transition-colors border ${
              mode === m ? "bg-primary text-white border-primary" : "bg-white text-foreground border-border hover:border-primary/40"
            }`}
          >
            <Icon name={m === "add" ? "Plus" : "Pencil"} size={14} />
            {m === "add" ? "Новый номер" : "Изменить описание"}
          </button>
        ))}
      </div>

      <div className="space-y-3">
          {mode === "edit" && (
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setSelected(null); setForm({ number: "", name: "", description: "", procedure: "", category: "" }); }}
                placeholder="Найдите номер для редактирования..."
                className="w-full pl-9 pr-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white border border-border rounded-xl mt-1 shadow-lg overflow-hidden">
                  {suggestions.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => selectNumber(n)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <span className="font-display font-bold text-primary text-sm w-16 flex-shrink-0">{n.number}</span>
                      <span className="text-sm text-foreground font-body truncate">{n.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(mode === "add" || selected) && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="Короткий номер *"
                  readOnly={mode === "edit" && !!selected}
                  className={`px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${mode === "edit" && selected ? "bg-muted text-muted-foreground" : ""}`}
                />
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Категория"
                  className="px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Название / назначение *"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Описание *"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <textarea
                rows={2}
                value={form.procedure}
                onChange={(e) => setForm({ ...form, procedure: e.target.value })}
                placeholder="Как воспользоваться (необязательно)"
                className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Icon name="Loader" size={16} className="animate-spin" />
                ) : (
                  <Icon name={mode === "add" ? "Plus" : "Pencil"} size={16} />
                )}
                {loading ? "Отправка..." : mode === "add" ? "Предложить номер" : "Отправить правку"}
              </button>
            </>
          )}

          {mode === "edit" && !selected && !suggestions.length && search.length > 0 && (
            <p className="text-center text-sm text-muted-foreground font-body py-4">Ничего не найдено — попробуйте другой запрос</p>
          )}
        </div>
    </div>
  );
}

export function HomeSection({ onNav }: { onNav: (s: string) => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Все короткие номера<br />в одном месте
          </h1>
          <p className="text-white/80 text-lg font-body mb-8 max-w-xl mx-auto">
            Экстренные службы, поддержка операторов, социальные сервисы — найдите нужный номер за секунды
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNav("directory")}
              className="px-6 py-3 bg-white text-primary rounded-xl font-body font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 justify-center"
            >
              <Icon name="Search" size={18} /> Открыть справочник
            </button>
            <button
              onClick={() => onNav("operators")}
              className="px-6 py-3 bg-white/15 text-white rounded-xl font-body font-semibold hover:bg-white/25 transition-colors flex items-center gap-2 justify-center border border-white/30"
            >
              <Icon name="Wifi" size={18} /> По операторам
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: "Phone",       count: `${NUMBERS.length}`,  label: "Номеров в базе" },
            { icon: "Wifi",        count: "5",                  label: "Операторов" },
            { icon: "ShieldCheck", count: "5",                  label: "Экстренных служб" },
            { icon: "RefreshCw",   count: LAST_UPDATED,         label: "Актуальность" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border text-center hover-scale">
              {s.icon ? <Icon name={s.icon as IconName} size={19} className="text-primary mx-auto mb-1" /> : <span className="block text-primary font-body font-light leading-none mx-auto mb-1 text-xl">N</span>}
              <div className="font-display text-2xl font-bold text-foreground">{s.count}</div>
              <div className="text-xs text-muted-foreground font-body">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick access */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Быстрый доступ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "AlertTriangle", title: "Экстренные",          desc: "112, 101, 102, 103, 104",         section: "universal", color: "text-red-600",    bg: "bg-red-50" },
            { icon: "Headphones",    title: "Поддержка операторов", desc: "МТС, Билайн, МегаФон, Т2",        section: "operators", color: "text-blue-600",   bg: "bg-blue-50" },
            { icon: "Heart",         title: "Социальные",           desc: "Психологическая помощь, здоровье", section: "universal", color: "text-purple-600", bg: "bg-purple-50" },
          ].map((item) => (
            <button
              key={item.title}
              onClick={() => onNav(item.section)}
              className="hover-scale bg-white border border-border rounded-xl p-5 text-left flex items-start gap-4 w-full"
            >
              <div className={`w-11 h-11 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon name={item.icon as IconName} size={22} className={item.color} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-body">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Access banner */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">Полный доступ к справочнику</h3>
            <p className="text-muted-foreground font-body">Подпишитесь на ТГ-канал или ВК-сообщество, чтобы следить за обновлениями и получить доступ ко всем коротким номерам.</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a href="https://t.me/qrnumber" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-3 bg-[#2AABEE] text-white rounded-xl font-body font-semibold hover:bg-[#239cd8] transition-colors no-underline">
              <Icon name="Send" size={18} /> Telegram
            </a>
            <a href="https://vk.com/qrnumber" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-3 bg-[#0077FF] text-white rounded-xl font-body font-semibold hover:bg-[#0066dd] transition-colors no-underline">
              <Icon name="Users" size={18} /> ВКонтакте
            </a>
          </div>
        </div>
      </div>

      {/* Add/Edit number form */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <NumberForm />
      </div>
    </div>
  );
}