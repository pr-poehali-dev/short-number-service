import { useState } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";

interface Place {
  name: string;
  type: string;
  description: string;
  distance_approx: number;
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

export function NearbySection() {
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "done" | "error">("idle");
  const [places, setPlaces] = useState<Place[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

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

  const sorted = [...places].sort((a, b) => a.distance_approx - b.distance_approx);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-start justify-between mb-1 gap-3">
        <div>
          <h2 className="font-display text-foreground text-xl font-light">- это еще и быстрый вопрос, который можно задать кнопкой или коротким номером.</h2>

        </div>
        <button
          onClick={() => { setShowPromptEditor(!showPromptEditor); if (!prompt) loadPrompt(); }}
          className="flex-shrink-0 p-2 rounded-lg hover:bg-muted border border-border transition-colors"
          title="Настройки AI-промпта"
        >
          <Icon name="Settings2" size={18} className="text-muted-foreground" />
        </button>
      </div>

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

      {status === "idle" && (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
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
            {sorted.map((p, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name={getIcon(p.type)} size={20} className="text-primary" fallback="Store" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <h3 className="font-display font-semibold text-foreground text-base leading-tight">{p.name}</h3>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border ${distanceColor(p.distance_approx)}`}>
                      ~{p.distance_approx} м
                    </span>
                  </div>
                  <p className="text-xs text-primary font-body font-medium mb-1">{p.type}</p>
                  <p className="text-sm text-muted-foreground font-body leading-snug">{p.description}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}