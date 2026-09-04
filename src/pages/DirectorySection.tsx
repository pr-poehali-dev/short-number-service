import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import { OPERATOR_COLORS, PhoneNumber, Operator } from "./data";
import { NumberCard } from "./SharedComponents";
import { ymGoal } from "@/lib/analytics";
import { FavoritesBar } from "./FavoritesBar";
import { Favorite } from "./useFavorites";
import PromoBanner from "@/components/PromoBanner";

function CommercialCard({ num, onClick }: { num: PhoneNumber; onClick: (n: PhoneNumber) => void }) {
  return (
    <button
      onClick={() => onClick(num)}
      className="number-card w-full text-left bg-white border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer"
    >
      <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 flex-col gap-0.5">
        <span className="font-display font-bold text-amber-700 text-sm leading-tight text-center px-1">{num.number}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">{num.name}</h3>
          <div className="flex-shrink-0 flex items-center gap-1">
            {num.industry && (
              <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium border bg-amber-50 text-amber-700 border-amber-200">
                {num.industry}
              </span>
            )}
            {num.deviceAccess !== "any" && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-body">
                <Icon name="Smartphone" size={11} /> <span className="hidden sm:inline">Смартфон</span>
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{num.description}</p>
        {num.regions && num.regions.length > 0 && (
          <p className="text-xs text-amber-600 font-body mt-1 truncate flex items-center gap-1">
            <Icon name="MapPin" size={11} className="flex-shrink-0" />
            {num.regions.slice(0, 2).join(", ")}{num.regions.length > 2 ? "…" : ""}
          </p>
        )}
      </div>
    </button>
  );
}

type Tab = "favorites" | "all" | "operators" | "commercial";

const COMMERCIAL_INDUSTRIES = ["Все", "Банк", "Транспорт", "Торговля", "Недвижимость"];

const GEO_REGION_URL = "https://functions.poehali.dev/efccc458-5f64-4643-b99d-8e2d716a1bab";
const GEO_REGION_COOKIE = "geo_region_applied";
const FILTERS_VISIBLE_COOKIE = "directory_filters_visible";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export function DirectorySection({ numbers, onSelect, initialCategory, favorites = [], onRemoveFavorite, onSelectFavorite, onSuggestNew }: { numbers: PhoneNumber[]; onSelect: (n: PhoneNumber) => void; initialCategory?: string; favorites?: Favorite[]; onRemoveFavorite?: (id: number) => void; onSelectFavorite?: (id: number) => void; onSuggestNew?: () => void }) {
  const [tab, setTab] = useState<Tab>(() => initialCategory === "Коммерческие" ? "commercial" : "all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "Все");
  const [activeOp, setActiveOp] = useState<Operator | "Все">("Все");
  const [commIndustry, setCommIndustry] = useState("Все");
  const [commDevice, setCommDevice] = useState<"all" | "mobile">("all");
  const [regionFilter, setRegionFilter] = useState("Все регионы");
  const [filtersVisible, setFiltersVisible] = useState(() => getCookie(FILTERS_VISIBLE_COOKIE) !== "0");

  function toggleFilters() {
    const next = !filtersVisible;
    setFiltersVisible(next);
    setCookie(FILTERS_VISIBLE_COOKIE, next ? "1" : "0");
    ymGoal("directory_filters_toggle", { visible: next });
  }

  const hasActiveFilters = query !== "" || category !== "Все" || activeOp !== "Все" || commIndustry !== "Все" || commDevice !== "all" || regionFilter !== "Все регионы";

  function resetFilters() {
    setQuery("");
    setCategory("Все");
    setActiveOp("Все");
    setCommIndustry("Все");
    setCommDevice("all");
    setRegionFilter("Все регионы");
    ymGoal("directory_filters_reset");
  }

  const allRegions = ["Все регионы", ...Array.from(new Set(numbers.flatMap((n) => n.regions ?? []))).sort()];

  useEffect(() => {
    if (getCookie(GEO_REGION_COOKIE)) return;
    setCookie(GEO_REGION_COOKIE, "1");
    fetch(GEO_REGION_URL)
      .then((r) => r.json())
      .then((data) => {
        if (data.region && allRegions.includes(data.region)) {
          setRegionFilter(data.region);
          ymGoal("directory_region_auto", { region: data.region });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "favorites",  label: "Избранное",     icon: "Star" },
    { id: "all",        label: "Все номера",    icon: "List" },
    { id: "operators",  label: "По операторам", icon: "Wifi" },
    { id: "commercial", label: "Коммерческие",  icon: "Building2" },
  ];

  const categories = ["Все", "Экстренные", "Поддержка", "Автоинформатор", "Безопасность", "Социальные", "Здоровье", "Коммерческие"];

  const favoriteIds = new Set(favorites.map((f) => f.id));
  const filteredFavorites = numbers.filter((n) => {
    if (!favoriteIds.has(n.id)) return false;
    const q = query.toLowerCase();
    const matchQ = !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q);
    const matchC = category === "Все" || n.category === category;
    const matchR = regionFilter === "Все регионы" || (n.regions && n.regions.includes(regionFilter));
    return matchQ && matchC && matchR;
  });

  const filteredAll = numbers.filter((n) => {
    const q = query.toLowerCase();
    const matchQ = !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q);
    const matchC = category === "Все" || n.category === category;
    const matchR = regionFilter === "Все регионы" || (n.regions && n.regions.includes(regionFilter));
    return matchQ && matchC && matchR;
  });

  const filteredOp = (activeOp === "Все"
    ? numbers.filter((n) => n.operator !== "Универсальный" && ["МТС", "Билайн", "МегаФон", "Т2"].includes(n.operator))
    : numbers.filter((n) => n.operator === activeOp)
  ).filter((n) => {
    const q = query.toLowerCase();
    const matchQ = !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q);
    const matchR = regionFilter === "Все регионы" || (n.regions && n.regions.includes(regionFilter));
    return matchQ && matchR;
  });

  const commercial = numbers.filter((n) => {
    if (n.category !== "Коммерческие") return false;
    const q = query.toLowerCase();
    const matchQ = !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) || n.operator.toLowerCase().includes(q);
    const matchI = commIndustry === "Все" || n.industry === commIndustry;
    const matchD = commDevice === "all" || n.deviceAccess === commDevice;
    const matchR = regionFilter === "Все регионы" || (n.regions && n.regions.includes(regionFilter));
    return matchQ && matchI && matchD && matchR;
  });

  return (
    <div className="animate-fade-in">
      {onRemoveFavorite && onSelectFavorite && (
        <FavoritesBar favorites={favorites} onRemove={onRemoveFavorite} onSelect={onSelectFavorite} />
      )}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <PromoBanner section="directory" />
      </div>
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display font-bold text-foreground text-2xl">Справочник</h2>
        {onSuggestNew && (
          <button
            onClick={onSuggestNew}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-body font-semibold hover:bg-primary/90 transition-colors flex-shrink-0"
          >
            <Icon name="Plus" size={15} /> Добавить
          </button>
        )}
      </div>
      <p className="text-muted-foreground font-body mb-6 text-sm">Нажмите на карточку, чтобы узнать подробности, использовать или сохранить</p>

      <div className="flex items-center justify-between gap-3 mb-6 border-b border-border">
        <div className="flex gap-2 overflow-x-auto scrollbar-none" style={{overflowY: 'hidden'}}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); ymGoal("directory_tab", { tab: t.id }); }}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-body font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon name={t.icon as Parameters<typeof Icon>[0]["name"]} size={15} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        {(tab === "favorites" || tab === "all" || tab === "operators" || tab === "commercial") && allRegions.length > 1 && (
          <div className="flex items-center gap-2 flex-shrink-0 pb-2">
            <Icon name="MapPin" size={15} className="text-muted-foreground flex-shrink-0" />
            <select
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); ymGoal("directory_region", { region: e.target.value }); }}
              className="border border-border rounded-lg w-9 px-1 text-transparent sm:w-auto sm:px-3 sm:text-foreground py-1.5 text-sm font-body bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {allRegions.map((r) => <option key={r} className="text-foreground">{r}</option>)}
            </select>
            {regionFilter !== "Все регионы" && (
              <button onClick={() => setRegionFilter("Все регионы")} className="text-xs text-muted-foreground hover:text-foreground">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
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
        <button
          onClick={toggleFilters}
          title={filtersVisible ? "Скрыть фильтры" : "Показать фильтры"}
          className={`flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-xl border transition-colors ${
            filtersVisible ? "bg-primary/10 border-primary/30 text-primary" : "bg-white border-border text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Icon name={filtersVisible ? "SlidersHorizontal" : "ListFilter"} size={18} />
        </button>
      </div>

      {tab === "favorites" && (
        <>
          {filtersVisible && (
            <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
              {categories.map((c) => (
                <button
                  key={`fav-${c}`}
                  onClick={() => { setCategory(c); ymGoal("directory_category", { category: c }); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    category === c ? "bg-primary text-white" : "bg-white border border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground font-body">Найдено: <strong>{filteredFavorites.length}</strong> номеров</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-body flex-shrink-0">
                <Icon name="RotateCcw" size={13} /> Сбросить фильтры
              </button>
            )}
          </div>
          {filteredFavorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFavorites.map((n) => <NumberCard key={n.id} num={n} onClick={onSelect} />)}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-body">
              <Icon name="Star" size={40} className="mx-auto mb-3 opacity-40" />
              <p>Избранных номеров пока нет</p>
              <p className="text-xs mt-1 opacity-70">Откройте карточку номера и нажмите на звезду, чтобы сохранить здесь. До 6 номеров.</p>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground font-body">
              <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
              <p>По заданным фильтрам ничего не найдено</p>
            </div>
          )}
        </>
      )}

      {tab === "all" && (
        <>
          {filtersVisible && (
            <div className="flex flex-nowrap gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); ymGoal("directory_category", { category: c }); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    category === c ? "bg-primary text-white" : "bg-white border border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground font-body">Найдено: <strong>{filteredAll.length}</strong> номеров</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-body flex-shrink-0">
                <Icon name="RotateCcw" size={13} /> Сбросить фильтры
              </button>
            )}
          </div>
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
          {filtersVisible && (
            <div className="flex flex-nowrap gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
              {(["Все", "МТС", "Билайн", "МегаФон", "Т2"] as (Operator | "Все")[]).map((op) => {
                const c = op === "Все" ? { bg: "bg-primary", text: "text-white", border: "border-primary" } : OPERATOR_COLORS[op as Operator];
                return (
                  <button
                    key={op}
                    onClick={() => { setActiveOp(op); ymGoal("directory_operator", { operator: op }); }}
                    className={`px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors border whitespace-nowrap flex-shrink-0 ${
                      activeOp === op ? `${c.bg} ${c.text} ${c.border}` : "bg-white border-border text-foreground hover:border-primary/30"
                    }`}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground font-body">Найдено: <strong>{filteredOp.length}</strong> номеров</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-body flex-shrink-0">
                <Icon name="RotateCcw" size={13} /> Сбросить фильтры
              </button>
            )}
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

      {tab === "commercial" && (
        <>
          {filtersVisible && (
            <div className="flex flex-nowrap items-center gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
              {COMMERCIAL_INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  onClick={() => { setCommIndustry(ind); ymGoal("directory_industry", { industry: ind }); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    commIndustry === ind ? "bg-amber-500 text-white" : "bg-white border border-border text-foreground hover:border-amber-300"
                  }`}
                >
                  {ind}
                </button>
              ))}
              <div className="w-px self-stretch bg-border flex-shrink-0 mx-1" />
              {([
                { val: "all",    label: "Все устройства", icon: "Smartphone" },
                { val: "mobile", label: "Смартфон",       icon: "Smartphone" },
              ] as const).map((d) => (
                <button
                  key={d.val}
                  onClick={() => setCommDevice(d.val)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-body font-medium transition-colors border whitespace-nowrap flex-shrink-0 ${
                    commDevice === d.val ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-white border-border text-muted-foreground hover:border-amber-200"
                  }`}
                >
                  <Icon name={d.icon as Parameters<typeof Icon>[0]["name"]} size={13} />
                  {d.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted-foreground font-body">Найдено: <strong>{commercial.length}</strong> номеров</p>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-body flex-shrink-0">
                <Icon name="RotateCcw" size={13} /> Сбросить фильтры
              </button>
            )}
          </div>
          {commercial.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {commercial.map((n) => <CommercialCard key={n.id} num={n} onClick={onSelect} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground font-body">
              <Icon name="SearchX" size={40} className="mx-auto mb-3 opacity-40" />
              <p>Номеров по выбранным фильтрам не найдено</p>
            </div>
          )}
        </>
      )}
    </div>
    </div>
  );
}

export function OperatorsSection({ numbers, onSelect }: { numbers: PhoneNumber[]; onSelect: (n: PhoneNumber) => void }) {
  const [activeOp, setActiveOp] = useState<Operator>("МТС");
  const filtered = numbers.filter((n) => n.operator === activeOp);

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

export function UniversalSection({ numbers, onSelect }: { numbers: PhoneNumber[]; onSelect: (n: PhoneNumber) => void }) {
  const universal = numbers.filter((n) => n.operator === "Универсальный");

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