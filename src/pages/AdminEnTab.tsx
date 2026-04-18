import { useState } from "react";
import { PhoneNumber } from "./data";
import { PhoneNumberEn } from "./data-en";
import Icon from "@/components/ui/icon";

export function AdminEnTab({
  ruNumbers,
  enNumbers,
  enSearch,
  onSearchChange,
  onSave,
  onReset,
}: {
  ruNumbers: PhoneNumber[];
  enNumbers: PhoneNumberEn[];
  enSearch: string;
  onSearchChange: (v: string) => void;
  onSave: (updated: PhoneNumberEn) => void;
  onReset: () => void;
}) {
  const [enEditingId, setEnEditingId] = useState<number | null>(null);
  const [enEditForm, setEnEditForm] = useState<PhoneNumberEn | null>(null);

  function handleEdit(id: number) {
    const enItem = enNumbers.find((e) => e.id === id) ?? { id, name: "", description: "", procedure: "" };
    setEnEditingId(id);
    setEnEditForm({ ...enItem });
  }

  function handleSave() {
    if (!enEditForm) return;
    onSave(enEditForm);
    setEnEditingId(null);
    setEnEditForm(null);
  }

  const enFiltered = ruNumbers.filter((n) => {
    const q = enSearch.toLowerCase();
    const en = enNumbers.find((e) => e.id === n.id);
    return !q || n.number.includes(q) || n.name.toLowerCase().includes(q) || (en?.name ?? "").toLowerCase().includes(q);
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="text"
            placeholder="Search by number or name..."
            value={enSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-border bg-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => { if (confirm("Reset all English translations to defaults?")) onReset(); }}
          className="text-sm px-3 py-2 rounded-xl border border-border text-muted-foreground hover:bg-muted font-body"
        >
          Reset to defaults
        </button>
        <a
          href="/en"
          target="_blank"
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 font-body"
        >
          <Icon name="ExternalLink" size={14} /> View /en
        </a>
      </div>

      <div className="text-xs text-muted-foreground font-body mb-4 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
        <Icon name="Info" size={13} className="inline mr-1" />
        Left column — Russian original (read-only). Right column — English translation (editable). Click <strong>Edit</strong> to open the editor for a row.
      </div>

      <div className="space-y-2">
        {enFiltered.map((num) => {
          const en = enNumbers.find((e) => e.id === num.id);
          const isEditing = enEditingId === num.id;

          return (
            <div key={num.id} className="bg-white border border-border rounded-xl overflow-hidden">
              {/* Row header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <span className="font-display font-bold text-white text-xs text-center px-1 leading-tight">{num.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-foreground text-sm">{num.number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body">{num.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-body">{num.operator}</span>
                  </div>
                </div>
                <button
                  onClick={() => isEditing ? setEnEditingId(null) : handleEdit(num.id)}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-body transition-colors ${
                    isEditing
                      ? "border border-border text-muted-foreground hover:bg-muted"
                      : "border border-primary/30 text-primary hover:bg-primary/5"
                  }`}
                >
                  <Icon name={isEditing ? "X" : "Pencil"} size={14} />
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              </div>

              {/* Two-column content */}
              <div className="grid grid-cols-2 divide-x divide-border">
                {/* RU column */}
                <div className="p-4 space-y-2">
                  <div className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    🇷🇺 Русский (оригинал)
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body mb-0.5">Название</p>
                    <p className="text-sm font-body text-foreground font-medium">{num.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-body mb-0.5">Описание</p>
                    <p className="text-sm font-body text-muted-foreground leading-relaxed">{num.description}</p>
                  </div>
                  {num.procedure && (
                    <div>
                      <p className="text-xs text-muted-foreground font-body mb-0.5">Как воспользоваться</p>
                      <p className="text-sm font-body text-muted-foreground leading-relaxed">{num.procedure}</p>
                    </div>
                  )}
                </div>

                {/* EN column */}
                <div className="p-4 space-y-2">
                  <div className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    🇬🇧 English {isEditing && <span className="text-primary">(editing)</span>}
                  </div>

                  {isEditing && enEditForm ? (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground font-body mb-1">Name</p>
                        <input
                          value={enEditForm.name}
                          onChange={(e) => setEnEditForm((f) => f ? { ...f, name: e.target.value } : f)}
                          placeholder="English name..."
                          className="w-full px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-body mb-1">Description</p>
                        <textarea
                          value={enEditForm.description}
                          onChange={(e) => setEnEditForm((f) => f ? { ...f, description: e.target.value } : f)}
                          placeholder="English description..."
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                      {num.procedure && (
                        <div>
                          <p className="text-xs text-muted-foreground font-body mb-1">How to use</p>
                          <textarea
                            value={enEditForm.procedure ?? ""}
                            onChange={(e) => setEnEditForm((f) => f ? { ...f, procedure: e.target.value } : f)}
                            placeholder="English procedure..."
                            rows={2}
                            className="w-full px-3 py-2 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          />
                        </div>
                      )}
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg font-body font-semibold text-sm hover:bg-primary/90 mt-1"
                      >
                        <Icon name="Check" size={14} /> Save translation
                      </button>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground font-body mb-0.5">Name</p>
                        <p className={`text-sm font-body font-medium ${en?.name ? "text-foreground" : "text-muted-foreground/40 italic"}`}>
                          {en?.name || "— not translated —"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-body mb-0.5">Description</p>
                        <p className={`text-sm font-body leading-relaxed ${en?.description ? "text-muted-foreground" : "text-muted-foreground/40 italic"}`}>
                          {en?.description || "— not translated —"}
                        </p>
                      </div>
                      {num.procedure && (
                        <div>
                          <p className="text-xs text-muted-foreground font-body mb-0.5">How to use</p>
                          <p className={`text-sm font-body leading-relaxed ${en?.procedure ? "text-muted-foreground" : "text-muted-foreground/40 italic"}`}>
                            {en?.procedure || "— not translated —"}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
