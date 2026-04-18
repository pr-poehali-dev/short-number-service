import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber, OPERATOR_COLORS } from "./data";
import { loadNumbers } from "./AdminPage";
import {
  loadNumbersEn,
  OPERATOR_MAP_EN,
  CATEGORY_MAP_EN,
  INDUSTRY_MAP_EN,
  FAQ_ITEMS_EN,
  PROCEDURES_EN,
} from "./data-en";
import { Link } from "react-router-dom";

const isShortNumber = (n: string) => n.replace(/\D/g, "").length <= 4;

function OperatorBadgeEn({ operator }: { operator: string }) {
  const c = OPERATOR_COLORS[operator as keyof typeof OPERATOR_COLORS] ?? {
    bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200",
  };
  return (
    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {OPERATOR_MAP_EN[operator] ?? operator}
    </span>
  );
}

function NumberCardEn({ num, enNum, onClick }: {
  num: PhoneNumber;
  enNum: { name: string; description: string } | undefined;
  onClick: (n: PhoneNumber, enN: typeof enNum) => void;
}) {
  const short = isShortNumber(num.number);
  const name = enNum?.name ?? num.name;
  const desc = enNum?.description ?? num.description;
  return (
    <button
      onClick={() => onClick(num, enNum)}
      className="number-card w-full text-left bg-white border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer"
    >
      {short ? (
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-white text-sm leading-tight text-center px-1">{num.number}</span>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="Phone" size={22} className="text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">{name}</h3>
          <OperatorBadgeEn operator={num.operator} />
        </div>
        {!short && (
          <p className="font-display font-bold text-primary text-sm mb-1 tracking-wide">{num.number}</p>
        )}
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{desc}</p>
      </div>
    </button>
  );
}

function NumberModalEn({
  num, enNum, onClose,
}: {
  num: PhoneNumber;
  enNum: { name: string; description: string; procedure?: string } | undefined;
  onClose: () => void;
}) {
  const short = isShortNumber(num.number);
  const name = enNum?.name ?? num.name;
  const desc = enNum?.description ?? num.description;
  const procedure = enNum?.procedure ?? num.procedure;
  const category = CATEGORY_MAP_EN[num.category] ?? num.category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            {short ? (
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-white text-xl">{num.number}</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="Phone" size={26} className="text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-0.5">{name}</h2>
              {!short && (
                <p className="font-display font-bold text-primary text-base tracking-wide mb-0.5">{num.number}</p>
              )}
              <OperatorBadgeEn operator={num.operator} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-foreground font-body leading-relaxed">{desc}</p>
          </div>
          {procedure && (
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-sm font-body font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Icon name="Info" size={14} /> How to use
              </p>
              <p className="text-sm text-blue-800 font-body">{procedure}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-body text-muted-foreground">Category:</span>
            <span className="text-sm font-body font-semibold text-foreground">{category}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border flex gap-3">
          <a
            href={`tel:${num.number}`}
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary text-white rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="Phone" size={18} /> Call
          </a>
        </div>
      </div>
    </div>
  );
}

type Tab = "all" | "operators" | "universal" | "commercial";

export default function IndexEn() {
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeOp, setActiveOp] = useState("МТС");
  const [selected, setSelected] = useState<{ ru: PhoneNumber; en: ReturnType<typeof loadNumbersEn>[0] | undefined } | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const ruNumbers = loadNumbers();
  const enNumbers = loadNumbersEn();

  function getEn(id: number) {
    return enNumbers.find((e) => e.id === id);
  }

  const CATEGORIES_EN = ["All", "Emergency", "Support", "IVR", "Security", "Social", "Health", "Commercial"];
  const CATEGORY_MAP_REVERSE: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_MAP_EN).map(([ru, en]) => [en, ru])
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "all",        label: "All numbers",   icon: "List" },
    { id: "operators",  label: "By operator",   icon: "Wifi" },
    { id: "universal",  label: "Universal",     icon: "Globe" },
    { id: "commercial", label: "Commercial",    icon: "Building2" },
  ];

  const OPERATORS_EN = [
    { ru: "МТС", en: "MTS" },
    { ru: "Билайн", en: "Beeline" },
    { ru: "МегаФон", en: "MegaFon" },
    { ru: "Т2", en: "T2" },
  ];

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-white text-xs">2407</span>
            </div>
            <span className="font-display font-bold text-foreground text-lg">SHORT-NUMBER.RF</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icon name="Globe" size={14} /> РУС
            </Link>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-body font-semibold">EN</span>
          </div>
        </div>
      </header>

      <main className="pb-12">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-background py-12 px-4 border-b border-border">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-body font-semibold px-3 py-1.5 rounded-full mb-4">
              <Icon name="Globe" size={13} /> English version
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl text-foreground mb-3 leading-tight">
              Short Phone Numbers<br />of Russia
            </h1>
            <p className="text-lg text-muted-foreground font-body mb-6 max-w-xl">
              Complete directory of short and service phone numbers: emergency services, operator support, banks, government services. All numbers verified manually.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setTab("all")}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
              >
                <Icon name="Search" size={16} /> Browse directory
              </button>
              <a
                href="tel:112"
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-body font-semibold hover:bg-red-100 transition-colors"
              >
                <Icon name="AlertTriangle" size={16} /> Emergency: 112
              </a>
            </div>
          </div>
        </section>

        {/* Emergency quick row */}
        <section className="max-w-6xl mx-auto px-4 py-6">
          <p className="text-xs text-muted-foreground font-body uppercase tracking-wider mb-3">Emergency numbers — free from any phone</p>
          <div className="flex flex-wrap gap-2">
            {[
              { number: "112", name: "Emergency" },
              { number: "101", name: "Fire / EMERCOM" },
              { number: "102", name: "Police" },
              { number: "103", name: "Ambulance" },
              { number: "104", name: "Gas" },
            ].map((e) => (
              <a
                key={e.number}
                href={`tel:${e.number}`}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-xl hover:border-primary/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-white text-xs">{e.number}</span>
                </div>
                <span className="text-sm font-body text-foreground group-hover:text-primary transition-colors">{e.name}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Directory */}
        <section className="max-w-6xl mx-auto px-4 py-4 animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Directory</h2>
          <p className="text-muted-foreground font-body mb-5 text-sm">Click a card to see details, call, or save the contact</p>

          {/* Tabs */}
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

          {/* All numbers */}
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
                    <NumberCardEn
                      key={n.id}
                      num={n}
                      enNum={getEn(n.id)}
                      onClick={(ru, en) => setSelected({ ru, en })}
                    />
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

          {/* By operator */}
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
                  <NumberCardEn key={n.id} num={n} enNum={getEn(n.id)} onClick={(ru, en) => setSelected({ ru, en })} />
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

          {/* Universal */}
          {tab === "universal" && (
            <>
              <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-body font-medium px-3 py-1.5 rounded-full mb-6">
                <Icon name="CheckCircle" size={13} /> Available from all phones and operators, even without SIM
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {universal.map((n) => (
                  <NumberCardEn key={n.id} num={n} enNum={getEn(n.id)} onClick={(ru, en) => setSelected({ ru, en })} />
                ))}
              </div>
            </>
          )}

          {/* Commercial */}
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
                      onClick={() => setSelected({ ru: n, en })}
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

        {/* FAQ */}
        <section className="max-w-6xl mx-auto px-4 py-8 border-t border-border mt-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQ_ITEMS_EN.map((item, i) => (
              <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                >
                  <span className="font-display font-semibold text-foreground">{item.q}</span>
                  <Icon
                    name={faqOpen === i ? "ChevronUp" : "ChevronDown"}
                    size={18}
                    className="text-muted-foreground flex-shrink-0"
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-4">
                    <p className="text-muted-foreground font-body leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Procedures */}
        <section className="max-w-6xl mx-auto px-4 py-8 border-t border-border">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">How to Get a Short Number</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PROCEDURES_EN.map((proc, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name={proc.icon as Parameters<typeof Icon>[0]["name"]} size={20} className="text-primary" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-3">{proc.title}</h3>
                <ol className="space-y-2 mb-4">
                  {proc.steps.map((step, j) => (
                    <li key={j} className="flex gap-2 text-sm font-body text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {j + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
                <div className="flex gap-3 text-xs font-body">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="Clock" size={12} /> {proc.time}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="Wallet" size={12} /> {proc.cost}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <span>short-number.rf / 2407.rf</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Русская версия</Link>
            <span>© 2026 · All numbers verified manually</span>
          </div>
        </div>
      </footer>

      {selected && (
        <NumberModalEn
          num={selected.ru}
          enNum={selected.en}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
