import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import {
  Bookmark, BookmarkGroup, BookmarkView, BookmarkCollection,
  getIcon, formatDate, groupBookmarks, groupByType, sortByDistance,
  BOOKMARK_VIEW_KEY, loadCollections, saveCollections, COLLECTION_COLORS,
} from "@/pages/nearby.types";

interface Props {
  bookmarks: Bookmark[];
  advice: string;
  adviceError: string;
  adviceLoading: boolean;
  onRemove: (id: string) => void;
  onAnalyze: () => void;
  onDismissAdvice?: () => void;
  coords?: { lat: number; lon: number } | null;
}

// ─── BookmarkCard ────────────────────────────────────────────────────────────
function BookmarkCard({
  bm, onRemove, draggable, onDragStart,
}: {
  bm: Bookmark;
  onRemove: (id: string) => void;
  draggable?: boolean;
  onDragStart?: (id: string) => void;
}) {
  const typeLabel = bm.type.charAt(0).toUpperCase() + bm.type.slice(1);
  const spec = bm.profile && bm.profile.toLowerCase() !== bm.type.toLowerCase() ? bm.profile : "";
  return (
    <div
      className={`bg-white border border-border rounded-xl p-4 flex items-start gap-3 ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      draggable={draggable}
      onDragStart={() => onDragStart?.(bm.id)}
    >
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon name={getIcon(bm.type)} size={20} className="text-primary" fallback="Store" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-display font-semibold text-foreground text-base leading-tight truncate">{bm.name}</p>
          <button
            onClick={() => onRemove(bm.id)}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1.5 mb-0.5 min-w-0 flex-wrap">
          <p className="text-xs text-primary font-body font-medium">{typeLabel}</p>
          {spec && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-body">{spec}</span>}
          {bm.hours && (
            <span className="text-xs text-muted-foreground font-body flex items-center gap-0.5">
              <Icon name="Clock" size={10} className="flex-shrink-0" />
              {bm.hours.replace("Сегодня: ", "")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          {(bm.city || bm.address) && (
            <p className="text-xs text-muted-foreground font-body flex items-center gap-1 truncate min-w-0">
              <Icon name="MapPin" size={10} className="flex-shrink-0" />
              <span className="truncate">{[bm.city, bm.address].filter(Boolean).join(", ")}</span>
            </p>
          )}
          <a
            href={`https://2gis.ru/search/${encodeURIComponent(bm.name + (bm.address ? " " + bm.address : ""))}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-body flex items-center gap-1 flex-shrink-0 hover:underline"
          >
            <Icon name="ExternalLink" size={10} className="flex-shrink-0" />2ГИС
          </a>
          <span className="text-xs text-muted-foreground font-body flex items-center gap-1 flex-shrink-0 ml-auto">
            <Icon name="Clock" size={10} className="flex-shrink-0" />
            {formatDate(bm.savedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── GroupCard (дни) ─────────────────────────────────────────────────────────
function GroupCard({ group, onRemove }: { group: BookmarkGroup; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="MapPin" size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground leading-tight">{group.label}</p>
          <p className="text-xs text-muted-foreground font-body truncate">
            {group.cityLabel} · {group.bookmarks.length} {group.bookmarks.length === 1 ? "место" : group.bookmarks.length < 5 ? "места" : "мест"}
          </p>
        </div>
        <Icon name="ChevronDown" size={16} className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="divide-y divide-border/60">
          {group.bookmarks.map(bm => (
            <div key={bm.id} className="px-2 py-2">
              <BookmarkCard bm={bm} onRemove={onRemove} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TypeGroup ───────────────────────────────────────────────────────────────
function TypeGroupCard({ type, bookmarks, onRemove }: { type: string; bookmarks: Bookmark[]; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(true);
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name={getIcon(type)} size={14} className="text-primary" fallback="Store" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground leading-tight">{label}</p>
          <p className="text-xs text-muted-foreground font-body">
            {bookmarks.length} {bookmarks.length === 1 ? "место" : bookmarks.length < 5 ? "места" : "мест"}
          </p>
        </div>
        <Icon name="ChevronDown" size={16} className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="divide-y divide-border/60">
          {bookmarks.map(bm => (
            <div key={bm.id} className="px-2 py-2">
              <BookmarkCard bm={bm} onRemove={onRemove} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Collections view ────────────────────────────────────────────────────────
function CollectionsView({ bookmarks, onRemove }: { bookmarks: Bookmark[]; onRemove: (id: string) => void }) {
  const [collections, setCollections] = useState<BookmarkCollection[]>(loadCollections);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("blue");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [openCols, setOpenCols] = useState<Record<string, boolean>>({});

  useEffect(() => { saveCollections(collections); }, [collections]);

  function createCollection() {
    if (!newName.trim()) return;
    const col: BookmarkCollection = {
      id: `col_${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      bookmarkIds: [],
      createdAt: new Date().toISOString(),
    };
    setCollections(prev => [...prev, col]);
    setOpenCols(prev => ({ ...prev, [col.id]: true }));
    setNewName("");
    setCreating(false);
  }

  function deleteCollection(id: string) {
    setCollections(prev => prev.filter(c => c.id !== id));
  }

  function dropToCollection(colId: string) {
    if (!draggingId) return;
    setCollections(prev => prev.map(c =>
      c.id === colId && !c.bookmarkIds.includes(draggingId)
        ? { ...c, bookmarkIds: [...c.bookmarkIds, draggingId] }
        : c
    ));
    setDraggingId(null);
  }

  function removeFromCollection(colId: string, bmId: string) {
    setCollections(prev => prev.map(c =>
      c.id === colId ? { ...c, bookmarkIds: c.bookmarkIds.filter(id => id !== bmId) } : c
    ));
  }

  const assignedIds = new Set(collections.flatMap(c => c.bookmarkIds));
  const unassigned = bookmarks.filter(bm => !assignedIds.has(bm.id));

  return (
    <div className="space-y-3">
      {/* Кнопка создания */}
      {!creating ? (
        <button
          onClick={() => setCreating(true)}
          className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-border rounded-xl text-sm font-body text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Icon name="FolderPlus" size={15} /> Создать коллекцию
        </button>
      ) : (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-display font-semibold text-foreground">Новая коллекция</p>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createCollection(); if (e.key === "Escape") setCreating(false); }}
            placeholder="Название, напр. «Работа» или «Дом»"
            className="w-full px-3 py-2.5 border border-border rounded-lg font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <div className="flex gap-2">
            {COLLECTION_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setNewColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.bg} ${c.border} border-2 transition-all ${newColor === c.id ? "ring-2 ring-primary ring-offset-1 scale-110" : ""}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={createCollection} disabled={!newName.trim()} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-body font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors">
              Создать
            </button>
            <button onClick={() => setCreating(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-body text-muted-foreground hover:bg-muted transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Коллекции */}
      {collections.map(col => {
        const colColor = COLLECTION_COLORS.find(c => c.id === col.color) ?? COLLECTION_COLORS[0];
        const colBookmarks = col.bookmarkIds.map(id => bookmarks.find(b => b.id === id)).filter(Boolean) as Bookmark[];
        const isOpen = openCols[col.id] !== false;
        return (
          <div
            key={col.id}
            className={`border rounded-xl overflow-hidden ${colColor.border}`}
            onDragOver={e => e.preventDefault()}
            onDrop={() => dropToCollection(col.id)}
          >
            <div className={`flex items-center gap-2.5 px-3 py-2.5 ${colColor.bg}`}>
              <button onClick={() => setOpenCols(prev => ({ ...prev, [col.id]: !isOpen }))} className="flex items-center gap-2.5 flex-1 text-left min-w-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colColor.bg}`}>
                  <Icon name="Folder" size={14} className={colColor.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-display font-semibold leading-tight ${colColor.text}`}>{col.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{colBookmarks.length} мест</p>
                </div>
                <Icon name="ChevronDown" size={16} className={`${colColor.text} flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </button>
              <button onClick={() => deleteCollection(col.id)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/10 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0">
                <Icon name="Trash2" size={13} />
              </button>
            </div>
            {isOpen && (
              <div className="divide-y divide-border/60">
                {colBookmarks.length === 0 && (
                  <p className="text-xs text-muted-foreground font-body text-center py-4 px-3">
                    Перетащите закладку сюда
                  </p>
                )}
                {colBookmarks.map(bm => (
                  <div key={bm.id} className="px-2 py-2 relative">
                    <BookmarkCard bm={bm} onRemove={onRemove} />
                    <button
                      onClick={() => removeFromCollection(col.id, bm.id)}
                      className="absolute top-3 right-3 text-xs font-body text-muted-foreground hover:text-foreground underline"
                      title="Убрать из коллекции"
                    >
                      <Icon name="FolderMinus" size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Не распределённые */}
      {unassigned.length > 0 && (
        <div className="border border-dashed border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20">
            <Icon name="Inbox" size={14} className="text-muted-foreground" />
            <p className="text-sm font-display font-semibold text-muted-foreground flex-1">Без коллекции</p>
            <p className="text-xs text-muted-foreground font-body">{unassigned.length} мест</p>
          </div>
          <div className="divide-y divide-border/60">
            {unassigned.map(bm => (
              <div key={bm.id} className="px-2 py-2">
                <BookmarkCard bm={bm} onRemove={onRemove} draggable onDragStart={setDraggingId} />
              </div>
            ))}
          </div>
          {collections.length > 0 && (
            <p className="text-xs text-muted-foreground font-body text-center py-2 border-t border-border/60">
              Перетащите карточку в коллекцию
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── VIEW SWITCHER ────────────────────────────────────────────────────────────
const VIEW_OPTIONS: { id: BookmarkView; label: string; icon: string }[] = [
  { id: "default",     label: "По дате",       icon: "CalendarDays" },
  { id: "distance",    label: "По расстоянию", icon: "Navigation"   },
  { id: "type",        label: "По типу",       icon: "LayoutGrid"   },
  { id: "collections", label: "Коллекции",     icon: "Folder"       },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function NearbyBookmarks({
  bookmarks, advice, adviceError, adviceLoading,
  onRemove, onAnalyze, onDismissAdvice, coords,
}: Props) {
  const [view, setView] = useState<BookmarkView>(() => {
    return (localStorage.getItem(BOOKMARK_VIEW_KEY) as BookmarkView) ?? "default";
  });
  const [showViewPicker, setShowViewPicker] = useState(false);

  function changeView(v: BookmarkView) {
    setView(v);
    localStorage.setItem(BOOKMARK_VIEW_KEY, v);
    setShowViewPicker(false);
  }

  const useGroups = bookmarks.length > 3;
  const groups = useGroups && view === "default" ? groupBookmarks(bookmarks) : [];
  const typeGroups = view === "type" ? groupByType(bookmarks) : [];
  const sortedByDist = view === "distance" && coords
    ? sortByDistance(bookmarks, coords.lat, coords.lon)
    : bookmarks;

  const currentViewLabel = VIEW_OPTIONS.find(v => v.id === view)?.label ?? "По дате";
  const currentViewIcon = VIEW_OPTIONS.find(v => v.id === view)?.icon ?? "CalendarDays";

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Star" size={15} className="text-primary" />
        <span className="font-display font-semibold text-foreground text-sm">Избранное с AI-поиском</span>

        {bookmarks.length > 0 && (
          <>
            {/* Переключатель вида */}
            <div className="relative ml-auto">
              <button
                onClick={() => setShowViewPicker(v => !v)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-xs font-body text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon name={currentViewIcon as Parameters<typeof Icon>[0]["name"]} size={12} />
                {currentViewLabel}
                <Icon name="ChevronDown" size={11} className={`transition-transform ${showViewPicker ? "rotate-180" : ""}`} />
              </button>
              {showViewPicker && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-[170px]">
                  {VIEW_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => changeView(opt.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-body transition-colors text-left ${
                        view === opt.id ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon name={opt.icon as Parameters<typeof Icon>[0]["name"]} size={14} />
                      {opt.label}
                      {opt.id === "distance" && !coords && (
                        <span className="ml-auto text-xs text-amber-500">нет GPS</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI кнопка */}
            <button
              onClick={onAnalyze}
              disabled={adviceLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <Icon name={adviceLoading ? "Loader" : "Sparkles"} size={13} className={adviceLoading ? "animate-spin" : ""} />
              {adviceLoading ? "Анализирую..." : "Что посетить?"}
            </button>
          </>
        )}
      </div>

      {/* AI advice */}
      {(advice || adviceError) && (
        <div className={`mb-3 rounded-xl p-4 border ${adviceError ? "bg-red-50 border-red-200" : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {adviceError ? (
                <p className="text-sm font-body text-red-600">{adviceError}</p>
              ) : (
                <>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Icon name="Sparkles" size={14} className="text-primary" />
                    <span className="text-xs font-body font-semibold text-primary">Рекомендация нейросети</span>
                  </div>
                  <p className="text-sm font-body text-foreground leading-relaxed">{advice}</p>
                </>
              )}
            </div>
            {onDismissAdvice && (
              <button onClick={onDismissAdvice} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/10 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
                <Icon name="X" size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {bookmarks.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-5 text-center">
          <Icon name="BookmarkX" size={28} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-body text-muted-foreground">Закладок пока нет</p>
          <p className="text-xs font-body text-muted-foreground/70 mt-1 max-w-xs mx-auto">
            Найдите объекты рядом и нажмите <Icon name="Bookmark" size={11} className="inline mx-0.5 relative -top-px" /> на карточке — место сохранится здесь до очистки кеша браузера
          </p>
        </div>
      ) : view === "collections" ? (
        <CollectionsView bookmarks={bookmarks} onRemove={onRemove} />
      ) : view === "type" ? (
        <div className="space-y-2">
          {typeGroups.map(g => (
            <TypeGroupCard key={g.type} type={g.type} bookmarks={g.bookmarks} onRemove={onRemove} />
          ))}
        </div>
      ) : view === "distance" ? (
        <div className="space-y-2">
          {!coords && (
            <p className="text-xs text-amber-600 font-body flex items-center gap-1 mb-2">
              <Icon name="AlertTriangle" size={13} /> Геолокация недоступна — показан порядок сохранения
            </p>
          )}
          {sortedByDist.map(bm => (
            <BookmarkCard key={bm.id} bm={bm} onRemove={onRemove} />
          ))}
        </div>
      ) : useGroups ? (
        <div className="space-y-2">
          {groups.map(group => (
            <GroupCard key={group.id} group={group} onRemove={onRemove} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map(bm => (
            <BookmarkCard key={bm.id} bm={bm} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
