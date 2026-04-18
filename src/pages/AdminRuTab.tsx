import { useState } from "react";
import { PhoneNumber, Operator } from "./data";
import Icon from "@/components/ui/icon";

const OPERATORS: Operator[] = ["МТС", "Билайн", "МегаФон", "Т2", "Универсальный", "Коммерческий"];
const CATEGORIES = ["Экстренные", "Поддержка", "Автоинформатор", "Безопасность", "Социальные", "Здоровье", "Коммерческие"];
const INDUSTRIES = ["Банк", "Транспорт", "Торговля", "Страхование", "Медицина", "Государственные", "Другое"];

export const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-body font-semibold text-muted-foreground mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function EditModal({
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

          {form.category === "Коммерческие" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Field label="Индустрия">
                <select value={form.industry ?? ""} onChange={(e) => set("industry", e.target.value)} className={inputCls}>
                  <option value="">— не выбрано —</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Доступность">
                <select
                  value={form.deviceAccess ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, deviceAccess: (e.target.value as "mobile" | "any") || undefined }))}
                  className={inputCls}
                >
                  <option value="">— не указано —</option>
                  <option value="mobile">Только смартфон</option>
                  <option value="any">Смартфон + обычный телефон</option>
                </select>
              </Field>
            </div>
          )}

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

export function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-display font-bold text-foreground text-lg mb-2">Удалить запись?</h3>
        <p className="text-sm text-muted-foreground font-body mb-5">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border font-body text-sm hover:bg-muted"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-body font-semibold text-sm hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

const emptyNumber = (): Omit<PhoneNumber, "id"> => ({
  number: "",
  name: "",
  description: "",
  operator: "Универсальный",
  category: "Поддержка",
  procedure: "",
  organization: "",
  industry: "",
  deviceAccess: undefined,
});

export function AdminRuTab({
  numbers,
  filtered,
  search,
  onSearchChange,
  onAdd,
  onEdit,
  onDeleteRequest,
}: {
  numbers: PhoneNumber[];
  filtered: PhoneNumber[];
  search: string;
  onSearchChange: (v: string) => void;
  onAdd: (num: PhoneNumber) => void;
  onEdit: (num: PhoneNumber) => void;
  onDeleteRequest: (id: number) => void;
}) {
  const [editing, setEditing] = useState<PhoneNumber | null>(null);
  const [isNew, setIsNew] = useState(false);

  function handleSave(num: PhoneNumber) {
    onAdd(num);
    setEditing(null);
    setIsNew(false);
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Поиск по номеру, названию, категории..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          onClick={() => { setEditing({ id: 0, ...emptyNumber() } as PhoneNumber); setIsNew(true); }}
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
                onClick={() => onDeleteRequest(num.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"
              >
                <Icon name="Trash2" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditModal
          num={editing}
          isNew={isNew}
          onSave={handleSave}
          onClose={() => { setEditing(null); setIsNew(false); }}
        />
      )}
    </>
  );
}
