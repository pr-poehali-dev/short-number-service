import { useState, useEffect } from "react";
import { Place, Bookmark, loadBookmarks, saveBookmarks } from "@/pages/nearby.types";
import { NearbyPromptEditor } from "@/pages/NearbyPromptEditor";
import { NearbyBookmarks } from "@/pages/NearbyBookmarks";
import { NearbyResults } from "@/pages/NearbyResults";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";
const ANALYZE_URL = "https://functions.poehali.dev/f314b7e4-d728-4c13-bfd3-c1962a5861fc";

const IS_IFRAME = window.self !== window.top;

const MOCK_PLACES: Place[] = [
  { name: "Кофейня «Бодрость»", type: "кафе", description: "Кофейня. Сегодня: 08:00–22:00", distance_approx: 85, address: "ул. Ленина, 12", label: "кафе", profile: "Кофейня" },
  { name: "Аптека Здоровье", type: "аптека", description: "Аптека. Сегодня: 09:00–21:00", distance_approx: 140, address: "пр. Мира, 5", label: "аптека", profile: "Аптека" },
  { name: "Супермаркет «Пятёрочка»", type: "супермаркет", description: "Супермаркет. Сегодня: 08:00–23:00", distance_approx: 210, address: "ул. Советская, 3", label: "супермаркет", profile: "Супермаркет" },
  { name: "Ресторан «Причал»", type: "ресторан", description: "Ресторан. Сегодня: 12:00–00:00", distance_approx: 320, address: "набережная, 1", label: "ресторан", profile: "Ресторан" },
  { name: "Банк ВТБ", type: "банк", description: "Банк. Сегодня: 09:00–18:00", distance_approx: 380, address: "пл. Победы, 7", label: "банк", profile: "Банк" },
  { name: "Салон красоты «Лотос»", type: "салон", description: "Салон красоты. Сегодня: 10:00–20:00", distance_approx: 450, address: "ул. Цветочная, 9", label: "салон", profile: "Салон красоты" },
];

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
  const [advice, setAdvice] = useState<string>("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");
  const [manualCoords, setManualCoords] = useState("");

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

  async function searchByCoords(lat: number, lon: number) {
    setCoords({ lat, lon });
    setStatus("loading");
    setPlaces([]);
    setErrorMsg("");
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

  async function analyzeBookmarks() {
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
        headers: { "Content-Type": "application/json" },
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
    return bookmarks.some(
      (b) => b.name === p.name && b.lat === coords?.lat && b.lon === coords?.lon
    );
  }

  const sorted = [...places].sort((a, b) => a.distance_approx - b.distance_approx);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {showPromptEditor && (
        <NearbyPromptEditor
          prompt={prompt}
          promptLoading={promptLoading}
          promptSaved={promptSaved}
          onPromptChange={setPrompt}
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
      />

      <NearbyResults
        status={status}
        sorted={sorted}
        coords={coords}
        errorMsg={errorMsg}
        bookmarks={bookmarks}
        savedId={savedId}
        onFind={findNearby}
        onReset={() => setStatus("idle")}
        onAddBookmark={addBookmark}
        onOpenSettings={() => { setShowPromptEditor(!showPromptEditor); if (!prompt) loadPrompt(); }}
        isBookmarked={isBookmarked}
        manualCoords={manualCoords}
        onManualCoordsChange={setManualCoords}
        onFindByManualCoords={findByManualCoords}
      />
    </div>
  );
}