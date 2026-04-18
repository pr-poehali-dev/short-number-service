import { useState, useEffect } from "react";
import { PhoneNumber, NUMBERS } from "./data";
import {
  PhoneNumberEn,
  loadNumbersEn,
  saveNumbersEn,
  NUMBERS_EN_DEFAULT,
} from "./data-en";
import Icon from "@/components/ui/icon";
import { AdminPinScreen } from "./AdminPinScreen";
import { AdminRuTab, DeleteModal } from "./AdminRuTab";
import { AdminEnTab } from "./AdminEnTab";

const STORAGE_KEY = "admin_numbers_v1";
const SESSION_KEY = "admin_auth_v1";

export function loadNumbers(): PhoneNumber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PhoneNumber[];
  } catch (e) {
    console.warn("loadNumbers error", e);
  }
  return NUMBERS;
}

function saveNumbers(nums: PhoneNumber[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nums));
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [adminTab, setAdminTab] = useState<"ru" | "en">("ru");

  const [numbers, setNumbers] = useState<PhoneNumber[]>(loadNumbers);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const [enNumbers, setEnNumbers] = useState<PhoneNumberEn[]>(loadNumbersEn);
  const [enSearch, setEnSearch] = useState("");

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function handleSave(num: PhoneNumber) {
    const isNew = !numbers.some((n) => n.id === num.id);
    let updated: PhoneNumber[];
    if (isNew) {
      const maxId = numbers.reduce((m, n) => Math.max(m, n.id), 0);
      updated = [...numbers, { ...num, id: maxId + 1 }];
    } else {
      updated = numbers.map((n) => (n.id === num.id ? num : n));
    }
    setNumbers(updated);
    saveNumbers(updated);
    setSaved(true);
  }

  function handleDelete(id: number) {
    const updated = numbers.filter((n) => n.id !== id);
    setNumbers(updated);
    saveNumbers(updated);
    setDeleteId(null);
  }

  function handleReset() {
    saveNumbers(NUMBERS);
    setNumbers(NUMBERS);
    setSaved(true);
  }

  function handleEnSave(updated: PhoneNumberEn) {
    const next = enNumbers.some((e) => e.id === updated.id)
      ? enNumbers.map((e) => (e.id === updated.id ? updated : e))
      : [...enNumbers, updated];
    setEnNumbers(next);
    saveNumbersEn(next);
    setSaved(true);
  }

  function handleEnReset() {
    saveNumbersEn(NUMBERS_EN_DEFAULT);
    setEnNumbers(NUMBERS_EN_DEFAULT);
    setSaved(true);
  }

  function handleExport() {
    const json = JSON.stringify(numbers, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `справочник-2407-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as PhoneNumber[];
        if (!Array.isArray(parsed) || !parsed[0]?.number) throw new Error("bad format");
        setNumbers(parsed);
        saveNumbers(parsed);
        setSaved(true);
      } catch {
        alert("Ошибка: файл не является корректным JSON-справочником");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const filtered = numbers.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.number.includes(search) ||
      n.category.toLowerCase().includes(search.toLowerCase())
  );

  if (!authed) {
    return <AdminPinScreen onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-white text-xs">2407</span>
            </div>
            <span className="font-display font-bold text-foreground">Администратор справочника</span>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-sm text-green-600 font-body flex items-center gap-1">
                <Icon name="Check" size={14} /> Сохранено
              </span>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body"
            >
              <Icon name="Download" size={14} /> Экспорт
            </button>
            <label className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body cursor-pointer">
              <Icon name="Upload" size={14} /> Импорт
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={() => {
                if (confirm("Сбросить все изменения и восстановить исходные данные?")) handleReset();
              }}
              className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body"
            >
              Сбросить
            </button>
            <a href="/" className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted font-body">
              На сайт
            </a>
            <button
              onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
              className="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-body"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      {/* Admin tabs */}
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 pt-2">
          <button
            onClick={() => setAdminTab("ru")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-body font-medium border-b-2 transition-colors ${
              adminTab === "ru" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name="Globe" size={14} /> 🇷🇺 Русская версия
          </button>
          <button
            onClick={() => setAdminTab("en")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-body font-medium border-b-2 transition-colors ${
              adminTab === "en" ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon name="Globe" size={14} /> 🇬🇧 English version
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {adminTab === "ru" && (
          <AdminRuTab
            numbers={numbers}
            filtered={filtered}
            search={search}
            onSearchChange={setSearch}
            onAdd={handleSave}
            onEdit={handleSave}
            onDeleteRequest={setDeleteId}
          />
        )}

        {adminTab === "en" && (
          <AdminEnTab
            ruNumbers={numbers}
            enNumbers={enNumbers}
            enSearch={enSearch}
            onSearchChange={setEnSearch}
            onSave={handleEnSave}
            onReset={handleEnReset}
          />
        )}
      </main>

      {deleteId !== null && (
        <DeleteModal
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
