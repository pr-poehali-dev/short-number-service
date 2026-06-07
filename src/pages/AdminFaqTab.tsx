import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";

interface FaqItem {
  id?: number;
  q: string;
  a: string;
}

export function AdminFaqTab() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(NEARBY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "get_faq", lang: "ru" }),
    })
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setError("Не удалось загрузить вопросы"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const token = sessionStorage.getItem("admin_token") || "";
      await fetch(NEARBY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Token": token },
        body: JSON.stringify({ _action: "update_faq", lang: "ru", items }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  function updateItem(idx: number, field: "q" | "a", value: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { q: "", a: "" }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveItem(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="Loader" size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">Управление FAQ</h2>
            <p className="text-sm text-muted-foreground font-body mt-0.5">Вопросы и ответы отображаются в разделе «FAQ»</p>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
          >
            <Icon name="Plus" size={15} />
            Добавить вопрос
          </button>
        </div>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground font-body py-6 text-center">Вопросов пока нет. Нажмите «Добавить вопрос».</p>
        )}

        <div className="space-y-4">
          {items.map((item, idx) => (
            <div key={idx} className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">Вопрос {idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg hover:bg-border disabled:opacity-30 transition-colors"
                    title="Вверх"
                  >
                    <Icon name="ChevronUp" size={14} />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="p-1.5 rounded-lg hover:bg-border disabled:opacity-30 transition-colors"
                    title="Вниз"
                  >
                    <Icon name="ChevronDown" size={14} />
                  </button>
                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors ml-1"
                    title="Удалить"
                  >
                    <Icon name="Trash2" size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1 block">Вопрос</label>
                <input
                  value={item.q}
                  onChange={(e) => updateItem(idx, "q", e.target.value)}
                  placeholder="Введите вопрос..."
                  className="w-full px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-body text-muted-foreground mb-1 block">Ответ</label>
                <textarea
                  value={item.a}
                  onChange={(e) => updateItem(idx, "a", e.target.value)}
                  placeholder="Введите ответ..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none bg-white"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 font-body flex items-center gap-1.5">
          <Icon name="AlertCircle" size={14} />
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl font-body font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Icon name="Loader" size={16} className="animate-spin" /> Сохранение...</>
        ) : saved ? (
          <><Icon name="Check" size={16} /> Сохранено</>
        ) : (
          <><Icon name="Save" size={16} /> Сохранить изменения</>
        )}
      </button>
    </div>
  );
}
