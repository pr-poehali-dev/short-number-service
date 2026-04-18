import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber, OPERATOR_COLORS } from "./data";
import { PhoneNumberEn, CATEGORY_MAP_EN, INDUSTRY_MAP_EN } from "./data-en";
import { NumberCardEn } from "./EnSharedComponents";

type Tab = "all" | "operators" | "universal" | "commercial";

const CATEGORIES_EN = ["All", "Emergency", "Support", "IVR", "Security", "Social", "Health", "Commercial"];

const CATEGORY_MAP_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_MAP_EN).map(([ru, en]) => [en, ru])
);

const OPERATORS_EN = [
  { ru: "МТС",     en: "MTS" },
  { ru: "Билайн",  en: "Beeline" },
  { ru: "МегаФон", en: "MegaFon" },
  { ru: "Т2",      en: "T2" },
];

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "all",        label: "All numbers", icon: "List" },
  { id: "operators",  label: "By operator", icon: "Wifi" },
  { id: "universal",  label: "Universal",   icon: "Globe" },
  { id: "commercial", label: "Commercial",  icon: "Building2" },
];

export function EnDirectorySection({
  ruNumbers,
  getEn,
  onSelect,
  initialTab,
}: {
  ruNumbers: PhoneNumber[];
  getEn: (id: number) => PhoneNumberEn | undefined;
  onSelect: (ru: PhoneNumber, en: PhoneNumberEn | undefined) => void;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeOp, setActiveOp] = useState("МТС");

  const filteredAll = ruNumbers.filter((n) => {
    const q = query.toLowerCase();
    const en = getEn(n.id);
    const matchQ = !q
      || n.number.includes(q)
      || n.name.toLowerCase().includes(q)
      || (en?.name ?? "").toLowerCase().includes(q)
      || (en?.description ?? n.description).toLowerCase().includes(q);
    const ruCat = CATEGORY_MAP_REVERSE[category] ?? category;
    const matchC = category === "All" || n.category === ruCat;
    return matchQ && matchC;
  });

  const filteredOp = ruNumbers.filter((n) => n.operator === activeOp);
  const universal = ruNumbers.filter((n) => n.operator === "Универсальный");
  const commercial = ruNumbers.filter((n) => n.category === "Коммерческие");

  return (
    <section className="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      <h2 className="font-display text-2xl font-bold text-foreground mb-1">Directory</h2>
      <p className="text-muted-foreground font-body mb-5 text-sm">Click a card to see details, call, or save the contact</p>

      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
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
              placeholder="Search by number, name or purpose..."
              className="w-full pl-10 pr-10 py-3 border border-border rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Icon name="X" size={16} className="text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap mb-5">
            {CATEGORIES_EN.map((c) => (
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
          <p className="text-sm text-muted-foreground font-body mb-4">Found: <strong>{filteredAll.length}</strong> numbers</p>
          {filteredAll.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredAll.map((n) => (
                <NumberCardEn key={n.id} num={n} enNum={getEn(n.id)} onClick={onSelect} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground font-body">
              <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
              <p>Nothing found for «{query}»</p>
            </div>
          )}
        </>
      )}

      {tab === "operators" && (
        <>
          <div className="flex gap-2 flex-wrap mb-6">
            {OPERATORS_EN.map((op) => {
              const c = OPERATOR_COLORS[op.ru as keyof typeof OPERATOR_COLORS];
              return (
                <button
                  key={op.ru}
                  onClick={() => setActiveOp(op.ru)}
                  className={`px-5 py-2 rounded-xl text-sm font-body font-semibold transition-all border ${
                    activeOp === op.ru ? `${c.bg} ${c.text} ${c.border} shadow-sm` : "bg-white border-border text-foreground hover:border-primary/30"
                  }`}
                >
                  {op.en}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredOp.map((n) => (
              <NumberCardEn key={n.id} num={n} enNum={getEn(n.id)} onClick={onSelect} />
            ))}
          </div>
          {filteredOp.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-body">
              <Icon name="PhoneOff" size={36} className="mx-auto mb-3 opacity-40" />
              <p>No numbers for this operator</p>
            </div>
          )}
        </>
      )}

      {tab === "universal" && (
        <>
          <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-body font-medium px-3 py-1.5 rounded-full mb-6">
            <Icon name="CheckCircle" size={13} /> Available from all phones and operators, even without SIM
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {universal.map((n) => (
              <NumberCardEn key={n.id} num={n} enNum={getEn(n.id)} onClick={onSelect} />
            ))}
          </div>
        </>
      )}

      {tab === "commercial" && (
        <>
          <p className="text-sm text-muted-foreground font-body mb-5">
            Short numbers of banks, transport, retail chains. Most require a smartphone.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commercial.map((n) => {
              const en = getEn(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() => onSelect(n, en)}
                  className="number-card w-full text-left bg-white border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <span className="font-display font-bold text-amber-700 text-sm leading-tight text-center px-1">{n.number}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">
                        {en?.name ?? n.name}
                      </h3>
                      {n.industry && (
                        <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border bg-amber-50 text-amber-700 border-amber-200">
                          {INDUSTRY_MAP_EN[n.industry] ?? n.industry}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-1.5">
                      {en?.description ?? n.description}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {n.deviceAccess === "any" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-body">
                          <Icon name="CheckCircle" size={11} /> Smartphone & landline
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-body">
                          <Icon name="Smartphone" size={11} /> Smartphone only
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
