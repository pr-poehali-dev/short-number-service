import { useState } from "react";
import Icon from "@/components/ui/icon";
import { NUMBERS, OPERATOR_COLORS, PhoneNumber, Operator } from "./data";
import { NumberCard } from "./SharedComponents";

type Tab = "all" | "operators" | "universal";

export function DirectorySection({ onSelect }: { onSelect: (n: PhoneNumber) => void }) {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Все");
  const [activeOp, setActiveOp] = useState<Operator>("МТС");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "all",       label: "Все номера",      icon: "List" },
    { id: "operators", label: "По операторам",   icon: "Wifi" },
    { id: "universal", label: "Универсальные",   icon: "Globe" },
  ];

  const categories = ["Все", "Экстренные", "Поддержка", "Автосервис", "Безопасность", "Социальные", "Здоровье"];

  const filteredAll = NUMBERS.filter((n) => {
    const q = query.toLowerCase();
    const matchQ = !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q);
    const matchC = category === "Все" || n.category === category;
    return matchQ && matchC;
  });

  const filteredOp = NUMBERS.filter((n) => n.operator === activeOp);
  const universal = NUMBERS.filter((n) => n.operator === "Универсальный");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Справочник номеров</h2>
      <p className="text-muted-foreground font-body mb-6">Нажмите на карточку, чтобы узнать подробности</p>

      <div className="flex gap-2 mb-6 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
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
          <p className="text-sm text-muted-foreground font-body mb-4">Найдено: <strong>{filteredAll.length}</strong> номеров</p>
          {filteredAll.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAll.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground font-body">
              <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
              <p>По запросу «{query}» ничего не найдено</p>
            </div>
          )}
        </>
      )}

      {tab === "operators" && (
        <>
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
          {filteredOp.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredOp.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground font-body">
              <Icon name="PhoneOff" size={36} className="mx-auto mb-3 opacity-40" />
              <p>Номеров для этого оператора пока нет</p>
            </div>
          )}
        </>
      )}

      {tab === "universal" && (
        <>
          <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-body font-medium px-3 py-1.5 rounded-full mb-6">
            <Icon name="CheckCircle" size={13} /> Доступны со всех телефонов и операторов
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {universal.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
          </div>
        </>
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
