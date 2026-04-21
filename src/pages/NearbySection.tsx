import { useState, useEffect } from "react";
import { Place, Bookmark, loadBookmarks, saveBookmarks } from "@/pages/nearby.types";
import { NearbyPromptEditor } from "@/pages/NearbyPromptEditor";
import { NearbyBookmarks } from "@/pages/NearbyBookmarks";
import { NearbyResults } from "@/pages/NearbyResults";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";
const ANALYZE_URL = "https://functions.poehali.dev/f314b7e4-d728-4c13-bfd3-c1962a5861fc";

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

  async function analyzeBookmarks() {
    setAdviceLoading(true);
    setAdviceError("");
    setAdvice("");
    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarks })
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
        onAddBookmark={addBookmark}
        onOpenSettings={() => { setShowPromptEditor(!showPromptEditor); if (!prompt) loadPrompt(); }}
        isBookmarked={isBookmarked}
      />
    </div>
  );
}
