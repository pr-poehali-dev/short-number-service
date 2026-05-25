import { useState, useEffect } from "react";
import { Place, Bookmark, loadBookmarks, saveBookmarks } from "@/pages/nearby.types";
import { ymGoal } from "@/lib/analytics";
import { NearbyPromptEditor } from "@/pages/NearbyPromptEditor";
import { NearbyBookmarks } from "@/pages/NearbyBookmarks";
import { NearbyResults } from "@/pages/NearbyResults";
import SubscribeModal from "@/components/SubscribeModal";
import PromoBanner from "@/components/PromoBanner";
import { useAdviceLimit, AdviceGateResult } from "@/hooks/useAdviceLimit";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";
const ANALYZE_URL = "https://functions.poehali.dev/f314b7e4-d728-4c13-bfd3-c1962a5861fc";

function getAdminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  return token ? { "X-Admin-Token": token } : {};
}

const IS_IFRAME = window.self !== window.top;

const NEARBY_CACHE_TTL = 5 * 60 * 1000;
const nearbyCache = new Map<string, { places: Place[]; ts: number }>();

function getCacheKey(lat: number, lon: number) {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function getCached(lat: number, lon: number): Place[] | null {
  const key = getCacheKey(lat, lon);
  const entry = nearbyCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > NEARBY_CACHE_TTL) { nearbyCache.delete(key); return null; }
  return entry.places;
}

function setCache(lat: number, lon: number, places: Place[]) {
  nearbyCache.set(getCacheKey(lat, lon), { places, ts: Date.now() });
}

const MOCK_PLACES: Place[] = [
  { name: "Кофейня «Бодрость»", type: "кафе", description: "Кофейня. Сегодня: 08:00–22:00", distance_approx: 85, city: "Москва", address: "ул. Ленина, 12", label: "кафе", profile: "завтраки, для семей", hours: "08:00–22:00" },
  { name: "Аптека «Здоровье»", type: "аптека", description: "Аптека. Сегодня: 09:00–21:00", distance_approx: 140, city: "Москва", address: "пр. Мира, 5", profile: "Сеть аптек", hours: "09:00–21:00" },
  { name: "Супермаркет «Пятёрочка»", type: "супермаркет", description: "Супермаркет. Сегодня: 08:00–23:00", distance_approx: 210, city: "Москва", address: "ул. Советская, 3", profile: "продукты, алкоголь", hours: "08:00–23:00" },
  { name: "Ресторан «Причал»", type: "ресторан", description: "Ресторан. Сегодня: 12:00–00:00", distance_approx: 320, city: "Москва", address: "набережная, 1", profile: "морепродукты, живая музыка", hours: "12:00–00:00" },
  { name: "Банк ВТБ", type: "банк", description: "Банк. Сегодня: 09:00–18:00", distance_approx: 380, city: "Москва", address: "пл. Победы, 7", profile: "кредиты, вклады", hours: "09:00–18:00" },
  { name: "Салон красоты «Лотос»", type: "салон красоты", description: "Салон красоты. Сегодня: 10:00–20:00", distance_approx: 450, city: "Москва", address: "ул. Цветочная, 9", profile: "маникюр, наращивание", hours: "10:00–20:00" },
];

export function NearbySection() {
  const [status, setStatus] = useState<"idle" | "locating" | "loading" | "done" | "error">("idle");
  const [places, setPlaces] = useState<Place[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [city, setCity] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadBookmarks());
  const [savedId, setSavedId] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");
  const [manualCoords, setManualCoords] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [subscribeModal, setSubscribeModal] = useState<AdviceGateResult | null>(null);
  const { check, consume, confirmSubscriber, cooldownMs } = useAdviceLimit();

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
        setCity(data.city || "");
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
        body: JSON.stringify({ _action: "update_prompt", prompt, city })
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

    if (IS_IFRAME) {
      setCoords({ lat: 55.7558, lon: 37.6173 });
      setPlaces(MOCK_PLACES);
      setStatus("done");
      return;
    }

    if (!navigator.geolocation) {
      setErrorMsg("Геолокация не поддерживается вашим браузером.");
      setStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await searchByCoords(pos.coords.latitude, pos.coords.longitude);
      },
      async (err) => {
        if (err.code === 1) {
          setErrorMsg("Доступ к геолокации запрещён. Нажмите на значок 🔒 в адресной строке браузера и разрешите определение местоположения для этого сайта.");
          setStatus("error");
        } else if (err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await searchByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            () => {
              setErrorMsg("Превышено время ожидания геолокации. Попробуйте ещё раз или введите координаты вручную.");
              setStatus("error");
            },
            { timeout: 20000, enableHighAccuracy: false, maximumAge: 300000 }
          );
        } else {
          setErrorMsg("Не удалось определить местоположение. Проверьте, что GPS или Wi-Fi включены.");
          setStatus("error");
        }
      },
      { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
    );
  }

  async function findByAddress() {
    const addr = manualAddress.trim();
    if (!addr) return;

    setStatus("loading");
    setPlaces([]);
    setErrorMsg("");
    setRateLimited(false);

    try {
      const res = await fetch(NEARBY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({ address: addr, city })
      });
      const data = await res.json();
      if (res.ok && data.places) {
        setPlaces(data.places);
        if (typeof data.remaining === "number") setRemainingRequests(data.remaining);
        setStatus("done");
      } else {
        if (res.status === 429) { setRateLimited(true); setRemainingRequests(0); }
        setErrorMsg(data.error || "Ошибка получения данных");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Не удалось связаться с сервером");
      setStatus("error");
    }
  }

  async function searchByCoords(lat: number, lon: number) {
    setCoords({ lat, lon });
    setErrorMsg("");
    setRateLimited(false);

    const cached = getCached(lat, lon);
    if (cached) {
      setPlaces(cached);
      setStatus("done");
      return;
    }

    setStatus("loading");
    setPlaces([]);
    try {
      const res = await fetch(NEARBY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({ lat, lon })
      });
      const data = await res.json();
      if (res.ok && data.places) {
        setCache(lat, lon, data.places);
        setPlaces(data.places);
        if (typeof data.remaining === "number") setRemainingRequests(data.remaining);
        setStatus("done");
      } else {
        if (res.status === 429) { setRateLimited(true); setRemainingRequests(0); }
        setErrorMsg(data.error || "Ошибка получения данных");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Не удалось связаться с сервером");
      setStatus("error");
    }
  }

  async function findByManualCoords() {
    const parts = manualCoords.replace(/\s/g, '').split(',');
    if (parts.length !== 2) return;
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lon)) return;
    await searchByCoords(lat, lon);
  }

  function addBookmark(p: Place) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const bm: Bookmark = {
      id,
      savedAt: new Date().toISOString(),
      lat: coords?.lat ?? 0,
      lon: coords?.lon ?? 0,
      name: p.name,
      type: p.type,
      description: p.description,
      distance_approx: p.distance_approx,
      address: p.address || "",
      city: p.city || city,
      label: p.label || p.type,
      profile: p.profile || "",
      hours: p.hours || "",
    };
    setBookmarks((prev) => [bm, ...prev]);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 1800);
    ymGoal("bookmark_add_nearby", { name: p.name, type: p.type, city: p.city || city });
  }

  function removeBookmark(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  async function analyzeBookmarks() {
    const gate = check();
    if (gate !== "ok") {
      setSubscribeModal(gate);
      return;
    }
    consume();
    setAdviceLoading(true);
    setAdviceError("");
    setAdvice("");

    const getCoords = (): Promise<{ lat: number; lon: number } | null> =>
      new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 8000, enableHighAccuracy: true }
        );
      });

    try {
      const currentCoords = await getCoords();
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminHeaders() },
        body: JSON.stringify({
          bookmarks,
          ...(currentCoords ?? {})
        })
      });
      const data = await res.json();
      if (res.ok && data.advice) {
        setAdvice(data.advice);
      } else {
        setAdviceError(data.error || "Не удалось получить рекомендацию");
      }
    } catch {
      setAdviceError("Не удалось связаться с сервером");
    } finally {
      setAdviceLoading(false);
    }
  }

  function isBookmarked(p: Place): boolean {
    return bookmarks.some((b) => b.name === p.name);
  }

  const sorted = [...places]
    .filter(p => !bookmarks.some(b => b.name === p.name))
    .sort((a, b) => a.distance_approx - b.distance_approx);
  const hiddenCount = places.length - sorted.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {subscribeModal && (
        <SubscribeModal
          mode={subscribeModal === "show_subscribe" ? "subscribe" : "plans"}
          cooldownHours={Math.ceil(cooldownMs() / 3600000)}
          onConfirmSubscribe={() => {
            confirmSubscriber();
            setSubscribeModal(null);
            analyzeBookmarks();
          }}
          onClose={() => setSubscribeModal(null)}
        />
      )}
      {showPromptEditor && (
        <NearbyPromptEditor
          prompt={prompt}
          city={city}
          promptLoading={promptLoading}
          promptSaved={promptSaved}
          onPromptChange={setPrompt}
          onCityChange={setCity}
          onSave={savePrompt}
          onClose={() => setShowPromptEditor(false)}
        />
      )}

      <NearbyBookmarks
        bookmarks={bookmarks}
        advice={advice}
        adviceError={adviceError}
        adviceLoading={adviceLoading}
        onRemove={removeBookmark}
        onAnalyze={analyzeBookmarks}
        onDismissAdvice={() => { setAdvice(""); setAdviceError(""); }}
      />

      <PromoBanner section="nearby" />

      <NearbyResults
        status={status}
        sorted={sorted}
        hiddenCount={hiddenCount}
        coords={coords}
        errorMsg={errorMsg}
        rateLimited={rateLimited}
        remainingRequests={remainingRequests}
        bookmarks={bookmarks}
        savedId={savedId}
        onFind={findNearby}
        onFindByAddress={findByAddress}
        onReset={() => setStatus("idle")}
        onAddBookmark={addBookmark}
        onOpenSettings={() => { setShowPromptEditor(!showPromptEditor); if (!prompt) loadPrompt(); }}
        isBookmarked={isBookmarked}
        manualCoords={manualCoords}
        onManualCoordsChange={setManualCoords}
        onFindByManualCoords={findByManualCoords}
        manualAddress={manualAddress}
        onManualAddressChange={setManualAddress}
        city={city}
      />
    </div>
  );
}