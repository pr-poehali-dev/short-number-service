import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";
const BOOKMARKS_KEY = "nearby_bookmarks";

interface Place {
  name: string;
  type: string;
  description: string;
  distance_approx: number;
  address?: string;
  label?: string;
  profile?: string;
}

interface Bookmark {
  id: string;
  savedAt: string;
  lat: number;
  lon: number;
  name: string;
  type: string;
  description: string;
  distance_approx: number;
  address: string;
  label: string;
  profile: string;
}

const TYPE_ICONS: Record<string, string> = {
  "магазин": "ShoppingBag",
  "аптека": "Pill",
  "кафе": "Coffee",
  "ресторан": "UtensilsCrossed",
  "банк": "Building2",
  "банкомат": "CreditCard",
  "салон": "Scissors",
  "сервис": "Wrench",
  "парикмахерская": "Scissors",
  "супермаркет": "ShoppingCart",
  "почта": "Mail",
  "больница": "Hospital",
  "клиника": "Hospital",
  "стоматология": "Hospital",
  "спортзал": "Dumbbell",
  "фитнес": "Dumbbell",
  "заправка": "Fuel",
  "автосервис": "Car",
  "прачечная": "WashingMachine",
  "химчистка": "WashingMachine",
  "цветы": "Flower2",
  "ювелирный": "Gem",
  "оптика": "Glasses",
};

function getIcon(type: string): string {
  const lower = type.toLowerCase();
  for (const key of Object.keys(TYPE_ICONS)) {
    if (lower.includes(key)) return TYPE_ICONS[key];
  }
  return "Store";
}

function distanceColor(d: number): string {
  if (d <= 100) return "text-green-600 bg-green-50 border-green-200";
  if (d <= 200) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-orange-600 bg-orange-50 border-orange-200";
}

const EXAMPLE_BOOKMARK: Bookmark = {
  id: "example_1",
  savedAt: "2026-04-20T10:30:00.000Z",
  lat: 55.7558,
  lon: 37.6173,
  name: "Кафе «Уют»",
  type: "кафе",
  description: "Уютное кафе с домашней кухней и свежей выпечкой. Работает с 8:00 до 22:00.",
  distance_approx: 120,
  address: "ул. Тверская, 14",
  label: "Еда",
  profile: "для семей, завтраки",
};

function loadBookmarks(): Bookmark[] {
  try {
    const stored = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
    if (stored.length === 0) {
      return [EXAMPLE_BOOKMARK];
    }
    return stored;
  } catch {
    return [EXAMPLE_BOOKMARK];
  }
}

function saveBookmarks(bms: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bms));
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NearbySection() {
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "done" | "error">("idle");
  const [places, setPlaces] = useState<Place[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    saveBookmarks(bookmarks);
  }, [bookmarks]);

  async function loadPrompt() {
    try {
      const res = await fetch(NEARBY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "get_prompt" })
      });
      if (res.ok) {
        const data = await res.json();
        setPrompt(data.prompt || "");
      }
    } catch (_e) {
      // ignore
    }
  }

  async function savePrompt() {
    setPromptLoading(true);
    try {
      await fetch(NEARBY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "update_prompt", prompt })
      });
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 2000);
    } finally {
      setPromptLoading(false);
    }
  }

  async function findNearby() {
    setStatus("locating");
    setPlaces([]);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
        setStatus("loading");

        try {
          const res = await fetch(NEARBY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon })
          });
          const data = await res.json();
          if (res.ok && data.places) {
            setPlaces(data.places);
            setStatus("done");
          } else {
            setErrorMsg(data.error || "Ошибка получения данных");
            setStatus("error");
          }
        } catch {
          setErrorMsg("Не удалось связаться с сервером");
          setStatus("error");
        }
      },
      (err) => {
        setErrorMsg(
          err.code === 1
            ? "Доступ к геолокации запрещён. Разрешите его в настройках браузера."
            : "Не удалось определить вашу геопозицию."
        );
        setStatus("error");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function addBookmark(p: Place) {
    if (!coords) return;
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const bm: Bookmark = {
      id,
      savedAt: new Date().toISOString(),
      lat: coords.lat,
      lon: coords.lon,
      name: p.name,
      type: p.type,
      description: p.description,
      distance_approx: p.distance_approx,
      address: p.address || "",
      label: p.label || p.type,
      profile: p.profile || "",
    };
    setBookmarks((prev) => [bm, ...prev]);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1800);
  }

  function removeBookmark(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  function isBookmarked(p: Place): boolean {
    return bookmarks.some(
      (b) => b.name === p.name && b.lat === coords?.lat && b.lon === coords?.lon
    );
  }

  const sorted = [...places].sort((a, b) => a.distance_approx - b.distance_approx);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">


      {showPromptEditor && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-body font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <Icon name="Bot" size={14} /> Промпт для нейросети
          </p>
          <textarea
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-amber-300 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white resize-none"
            placeholder="Загружается..."
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={savePrompt}
              disabled={promptLoading || !prompt}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-body font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <Icon name={promptSaved ? "Check" : "Save"} size={14} />
              {promptSaved ? "Сохранено!" : "Сохранить"}
            </button>
            <span className="text-xs text-amber-700 font-body">
              Используйте <code className="bg-amber-100 px-1 rounded">{"{lat}"}</code> и <code className="bg-amber-100 px-1 rounded">{"{lon}"}</code> для координат
            </span>
          </div>
        </div>
      )}

      {/* Закладки */}
      <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Bookmark" size={16} className="text-primary" />
            <span className="font-display font-semibold text-foreground text-sm">Сохранённые закладки</span>
            {bookmarks.length > 0 && (
              <span className="text-xs text-muted-foreground font-body">({bookmarks.length})</span>
            )}
          </div>
          {bookmarks.length === 0 ? (
            <div className="border-2 border-dashed border-border rounded-xl p-5 text-center">
              <Icon name="BookmarkX" size={28} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-body text-muted-foreground">Закладок пока нет</p>
              <p className="text-xs font-body text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                Найдите объекты рядом и нажмите <Icon name="Bookmark" size={11} className="inline mx-0.5 relative -top-px" /> на карточке — место сохранится здесь до очистки кеша браузера
              </p>
            </div>
          ) : (
          <div className="space-y-2">
            {bookmarks.map((bm) => (
              <div key={bm.id} className="bg-white border border-border rounded-xl p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon name={getIcon(bm.type)} size={16} className="text-primary" fallback="Store" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-foreground text-sm leading-tight truncate">{bm.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                        {bm.label && (
                          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-body font-medium">{bm.label}</span>
                        )}
                        {bm.profile && (
                          <span className="text-xs text-muted-foreground font-body">{bm.profile}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBookmark(bm.id)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Удалить закладку"
                    >
                      <Icon name="X" size={14} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {bm.address && (
                      <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                        <Icon name="MapPin" size={10} className="flex-shrink-0" />
                        {bm.address}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                      <Icon name="Navigation" size={10} className="flex-shrink-0" />
                      {bm.lat.toFixed(4)}, {bm.lon.toFixed(4)}
                    </span>
                    <span className="text-xs text-muted-foreground font-body flex items-center gap-1">
                      <Icon name="Clock" size={10} className="flex-shrink-0" />
                      {formatDate(bm.savedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

      {status === "idle" && (
        <div className="relative bg-white border border-border rounded-2xl p-8 text-center">
          <button
            onClick={() => { setShowPromptEditor(!showPromptEditor); if (!prompt) loadPrompt(); }}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted border border-border transition-colors"
            title="Настройки AI-промпта"
          >
            <Icon name="Settings2" size={18} className="text-muted-foreground" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="MapPin" size={32} className="text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">Нейросеть, найди полезное рядом!</h3>
          <p className="text-muted-foreground font-body text-sm mb-6 max-w-2xl mx-auto">Каждая сохраненная Вами закладка сделает её ответы еще точнее и вот — владельцы кафе, ресторанов и магазинов уже конкурируют, чтобы привлечь Ваше внимание.</p>
          <button
            onClick={findNearby}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="Locate" size={18} />
            Определить моё местоположение
          </button>
        </div>
      )}

      {(status === "locating" || status === "loading") && (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-body text-foreground font-semibold">
            {status === "locating" ? "Определяем местоположение…" : "Запрашиваем данные у ИИ…"}
          </p>
          {status === "loading" && (
            <p className="text-sm text-muted-foreground font-body mt-1">Это может занять 5–15 секунд</p>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <Icon name="AlertCircle" size={32} className="text-red-500 mx-auto mb-3" />
          <p className="font-body text-red-700 font-semibold mb-4">{errorMsg}</p>
          <button
            onClick={findNearby}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors text-sm"
          >
            <Icon name="RefreshCw" size={15} />
            Попробовать снова
          </button>
        </div>
      )}

      {status === "done" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-600" />
              <span className="text-sm font-body text-muted-foreground">
                Найдено объектов: <strong className="text-foreground">{sorted.length}</strong>
                {coords && (
                  <span className="ml-2 text-xs opacity-60">
                    ({coords.lat.toFixed(4)}, {coords.lon.toFixed(4)})
                  </span>
                )}
              </span>
            </div>
            <button
              onClick={findNearby}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-body hover:bg-muted transition-colors"
            >
              <Icon name="RefreshCw" size={14} />
              Обновить
            </button>
          </div>

          <div className="space-y-3">
            {sorted.map((p, i) => {
              const alreadySaved = isBookmarked(p);
              const justSaved = savedId !== null && bookmarks.find(b => b.id === savedId)?.name === p.name;
              return (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={getIcon(p.type)} size={20} className="text-primary" fallback="Store" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-display font-semibold text-foreground text-base leading-tight">{p.name}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium border ${distanceColor(p.distance_approx)}`}>
                          ~{p.distance_approx} м
                        </span>
                        <button
                          onClick={() => !alreadySaved && addBookmark(p)}
                          disabled={alreadySaved}
                          title={alreadySaved ? "Уже в закладках" : "Сохранить в закладки"}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            alreadySaved
                              ? "text-primary bg-primary/10 cursor-default"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border"
                          }`}
                        >
                          <Icon name={justSaved || alreadySaved ? "BookmarkCheck" : "Bookmark"} size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-primary font-body font-medium">{p.type}</p>
                      {p.label && p.label !== p.type && (
                        <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-body">{p.label}</span>
                      )}
                    </div>
                    {p.address && (
                      <p className="text-xs text-muted-foreground font-body mb-1 flex items-center gap-1">
                        <Icon name="MapPin" size={10} className="flex-shrink-0" />
                        {p.address}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground font-body leading-snug">{p.description}</p>
                    {p.profile && (
                      <p className="text-xs text-muted-foreground font-body mt-1 italic">{p.profile}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}