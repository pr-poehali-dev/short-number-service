import { useState, useEffect } from "react";
import { PhoneNumber, Operator, NUMBERS } from "./data";
import Icon from "@/components/ui/icon";

const ADMIN_PIN = "2407";
const STORAGE_KEY = "admin_numbers_v1";
const SESSION_KEY = "admin_auth_v1";

const OPERATORS: Operator[] = ["МТС", "Билайн", "МегаФон", "Т2", "Универсальный"];
const CATEGORIES = ["Экстренные", "Поддержка", "Автосервис", "Безопасность", "Социальные", "Здоровье", "Коммерческие"];

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

const empty = (): Omit<PhoneNumber, "id"> => ({
  number: "",
  name: "",
  description: "",
  operator: "Универсальный",
  category: "Поддержка",
  procedure: "",
  organization: "",
});

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [numbers, setNumbers] = useState<PhoneNumber[]>(loadNumbers);
  const [editing, setEditing] = useState<PhoneNumber | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function handlePinSubmit() {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setPinError(true);
      setPin("");
      setTimeout(() => setPinError(false), 1500);
    }
  }

  function handleSave(num: PhoneNumber) {
    let updated: PhoneNumber[];
    if (isNew) {
      const maxId = numbers.reduce((m, n) => Math.max(m, n.id), 0);
      updated = [...numbers, { ...num, id: maxId + 1 }];
    } else {
      updated = numbers.map((n) => (n.id === num.id ? num : n));
    }
    setNumbers(updated);
    saveNumbers(updated);
    setEditing(null);
    setIsNew(false);
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
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="font-display font-bold text-white text-xl">2407</span>
          </div>
          <h1 className="font-display font-bold text-xl text-foreground mb-1">Панель администратора</h1>
          <p className="text-sm text-muted-foreground font-body mb-6">Введите PIN-код для входа</p>
          <div className="flex gap-2 justify-center mb-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-display font-bold transition-colors ${
                  pinError
                    ? "border-red-400 bg-red-50 text-red-500"
                    : pin.length > i
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-muted text-transparent"
                }`}
              >
                {pin.length > i ? "•" : "·"}
              </div>
            ))}
          </div>
          {pinError && <p className="text-sm text-red-500 font-body mb-2">Неверный PIN</p>}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k) => (
              <button
                key={k}
                disabled={!k}
                onClick={() => {
                  if (k === "⌫") setPin((p) => p.slice(0, -1));
                  else if (pin.length < 4) {
                    const next = pin + k;
                    setPin(next);
                    if (next.length === 4) {
                      setTimeout(() => {
                        if (next === ADMIN_PIN) {
                          sessionStorage.setItem(SESSION_KEY, "1");
                          setAuthed(true);
                        } else {
                          setPinError(true);
                          setPin("");
                          setTimeout(() => setPinError(false), 1500);
                        }
                      }, 100);
                    }
                  }
                }}
                className={`h-12 rounded-xl font-display font-semibold text-lg transition-colors ${
                  k
                    ? "bg-muted hover:bg-primary/10 text-foreground active:bg-primary/20"
                    : "invisible"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
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

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Поиск по номеру, названию, категории..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => { setEditing({ id: 0, ...empty() } as PhoneNumber); setIsNew(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-body font-semibold text-sm hover:bg-primary/90"
          >
            <Icon name="Plus" size={16} /> Добавить
          </button>
        </div>

        <div className="text-xs text-muted-foreground font-body mb-3">
          Всего записей: {numbers.length} · Показано: {filtered.length}
        </div>

        <div className="space-y-2">
          {filtered.map((num) => (
            <div key={num.id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-white text-xs text-center px-1 leading-tight">{num.number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-display font-semibold text-foreground text-sm">{num.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body">{num.category}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body">{num.operator}</span>
                </div>
                {num.organization && (
                  <p className="text-xs text-muted-foreground font-body">{num.organization}</p>
                )}
                <p className="text-xs text-muted-foreground font-body line-clamp-1">{num.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => { setEditing({ ...num }); setIsNew(false); }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Icon name="Pencil" size={16} />
                </button>
                <button
                  onClick={() => setDeleteId(num.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {editing && (
        <EditModal
          num={editing}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => { setEditing(null); setIsNew(false); }}
        />
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-display font-bold text-foreground text-lg mb-2">Удалить запись?</h3>
            <p className="text-sm text-muted-foreground font-body mb-5">Это действие нельзя отменить.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-border font-body text-sm hover:bg-muted"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-body font-semibold text-sm hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditModal({
  num,
  isNew,
  onSave,
  onClose,
}: {
  num: PhoneNumber;
  isNew: boolean;
  onSave: (n: PhoneNumber) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PhoneNumber>({ ...num });

  function set(field: keyof PhoneNumber, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl my-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-foreground text-lg">
            {isNew ? "Новая запись" : "Редактировать запись"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Номер *" required>
              <input
                value={form.number}
                onChange={(e) => set("number", e.target.value)}
                required
                placeholder="112"
                className={inputCls}
              />
            </Field>
            <Field label="Оператор *">
              <select value={form.operator} onChange={(e) => set("operator", e.target.value as Operator)} className={inputCls}>
                {OPERATORS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Название *" required>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Экстренные службы"
              className={inputCls}
            />
          </Field>

          <Field label="Организация (для коммерческих номеров)">
            <input
              value={form.organization ?? ""}
              onChange={(e) => set("organization", e.target.value)}
              placeholder="ООО «Название компании»"
              className={inputCls}
            />
          </Field>

          <Field label="Категория *">
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Описание *" required>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
              rows={3}
              placeholder="Краткое описание номера..."
              className={inputCls + " resize-none"}
            />
          </Field>

          <Field label="Как воспользоваться (необязательно)">
            <textarea
              value={form.procedure ?? ""}
              onChange={(e) => set("procedure", e.target.value)}
              rows={2}
              placeholder="Инструкция по использованию..."
              className={inputCls + " resize-none"}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border font-body text-sm hover:bg-muted">
              Отмена
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white font-body font-semibold text-sm hover:bg-primary/90">
              {isNew ? "Добавить" : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-body font-semibold text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}