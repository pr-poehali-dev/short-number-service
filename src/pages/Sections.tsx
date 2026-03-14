import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NUMBERS, OPERATOR_COLORS, FAQ_ITEMS, PROCEDURES, PhoneNumber, Operator } from "./data";
import { NumberCard } from "./SharedComponents";

type IconName = Parameters<typeof Icon>[0]["name"];

export function HomeSection({ onNav }: { onNav: (s: string) => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 mb-6 text-sm font-body font-medium">
            <Icon name="Hash" size={14} /> Справочник коротких номеров России
          </div>
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
            { icon: "Hash",        count: `${NUMBERS.length}+`, label: "Номеров в базе" },
            { icon: "Wifi",        count: "5",                  label: "Операторов" },
            { icon: "ShieldCheck", count: "5",                  label: "Экстренных служб" },
            { icon: "RefreshCw",   count: "2026",               label: "Актуальность" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-border text-center hover-scale">
              <Icon name={s.icon as IconName} size={22} className="text-primary mx-auto mb-1" />
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
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">Полный доступ к справочнику</h3>
            <p className="text-muted-foreground font-body">Подпишитесь на Telegram-канал или ВКонтакте-сообщество, чтобы получить доступ ко всем номерам, процедурам и обновлениям базы.</p>
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
    </div>
  );
}

export function DirectorySection({ onSelect }: { onSelect: (n: PhoneNumber) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");

  const categories = ["Все", "Экстренные", "Поддержка", "Автосервис", "Безопасность", "Социальные", "Здоровье"];

  const filtered = NUMBERS.filter((n) => {
    const q = query.toLowerCase();
    const matchQ = !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q);
    const matchC = category === "Все" || n.category === category;
    return matchQ && matchC;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Справочник номеров</h2>
      <p className="text-muted-foreground font-body mb-6">Нажмите на карточку, чтобы узнать подробности</p>

      <div className="relative mb-4">
        <Icon name="Search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по номеру, названию или назначению..."
          className="w-full pl-10 pr-10 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Icon name="X" size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors ${
              category === c ? "bg-primary text-white" : "bg-white border border-border text-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground font-body mb-4">Найдено: <strong>{filtered.length}</strong> номеров</p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground font-body">
          <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
          <p>По запросу «{query}» ничего не найдено</p>
        </div>
      )}
    </div>
  );
}

export function OperatorsSection({ onSelect }: { onSelect: (n: PhoneNumber) => void }) {
  const [activeOp, setActiveOp] = useState<Operator>("МТС");
  const filtered = NUMBERS.filter((n) => n.operator === activeOp);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Номера по операторам</h2>
      <p className="text-muted-foreground font-body mb-6">Выберите оператора для просмотра его коротких номеров</p>

      <div className="flex gap-2 flex-wrap mb-6">
        {(["МТС", "Билайн", "МегаФон", "Т2"] as Operator[]).map((op) => {
          const c = OPERATOR_COLORS[op];
          return (
            <button
              key={op}
              onClick={() => setActiveOp(op)}
              className={`px-5 py-2 rounded-xl text-sm font-body font-semibold transition-all border ${
                activeOp === op ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-white border-border text-foreground hover:border-primary/30"
              }`}
            >
              {op}
            </button>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground font-body">
          <Icon name="PhoneOff" size={36} className="mx-auto mb-3 opacity-40" />
          <p>Номеров для этого оператора пока нет</p>
        </div>
      )}
    </div>
  );
}

export function UniversalSection({ onSelect }: { onSelect: (n: PhoneNumber) => void }) {
  const universal = NUMBERS.filter((n) => n.operator === "Универсальный");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Icon name="Globe" size={20} className="text-purple-700" />
        </div>
        <h2 className="font-display text-3xl font-bold text-foreground">Универсальные номера</h2>
      </div>
      <p className="text-muted-foreground font-body mb-3">Работают со всех операторов, включая звонки без SIM-карты</p>
      <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-body font-medium px-3 py-1.5 rounded-full mb-6">
        <Icon name="CheckCircle" size={13} /> Доступны со всех телефонов и операторов
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {universal.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
      </div>
    </div>
  );
}

export function ProceduresSection() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Процедуры получения номеров</h2>
      <p className="text-muted-foreground font-body mb-8">Пошаговые инструкции для юридических и физических лиц</p>

      <div className="space-y-5">
        {PROCEDURES.map((proc, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={proc.icon as IconName} size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-foreground">{proc.title}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                    <Icon name="Clock" size={13} /> {proc.time}
                  </span>
                  <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                    <Icon name="CreditCard" size={13} /> {proc.cost}
                  </span>
                </div>
              </div>
            </div>
            <ol className="space-y-2.5">
              {proc.steps.map((step, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-display font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <span className="text-sm text-foreground font-body leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Icon name="AlertCircle" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 font-body">
          Процедуры могут меняться. Перед подачей документов уточняйте актуальные требования на официальных сайтах операторов и Роскомнадзора.
        </p>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Часто задаваемые вопросы</h2>
      <p className="text-muted-foreground font-body mb-8">Ответы на популярные вопросы о коротких номерах</p>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-body font-semibold text-foreground pr-4">{item.q}</span>
              <Icon name={open === i ? "ChevronUp" : "ChevronDown"} size={18} className="text-muted-foreground flex-shrink-0" />
            </button>
            {open === i && (
              <div className="px-5 pb-4">
                <p className="text-foreground font-body leading-relaxed text-sm">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactsSection() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Контакты</h2>
      <p className="text-muted-foreground font-body mb-8">Свяжитесь с нами, чтобы предложить номер или сообщить об ошибке</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { icon: "Send",  title: "Telegram-канал", desc: "Новости и обновления базы", color: "bg-[#2AABEE]", link: "https://t.me/qrnumber" },
          { icon: "Users", title: "ВКонтакте",      desc: "Сообщество и поддержка",   color: "bg-[#0077FF]", link: "https://vk.com/qrnumber" },
        ].map((c) => (
          <a key={c.title} href={c.link} target="_blank" rel="noopener noreferrer"
            className="hover-scale bg-white border border-border rounded-xl p-5 flex items-center gap-4 no-underline"
          >
            <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center flex-shrink-0`}>
              <Icon name={c.icon as IconName} size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{c.desc}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="bg-white border border-border rounded-2xl p-6">
        <h3 className="font-display text-xl font-bold text-foreground mb-4">Предложить номер</h3>
        <div className="space-y-3">
          <input
            placeholder="Короткий номер"
            className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <input
            placeholder="Название / назначение"
            className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <textarea
            rows={3}
            placeholder="Описание и дополнительная информация"
            className="w-full px-4 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
          <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
            <Icon name="Send" size={16} /> Отправить предложение
          </button>
        </div>
      </div>
    </div>
  );
}
