import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Bookmark, BookmarkGroup, getIcon, formatDate, groupBookmarks } from "@/pages/nearby.types";

interface Props {
  bookmarks: Bookmark[];
  advice: string;
  adviceError: string;
  adviceLoading: boolean;
  onRemove: (id: string) => void;
  onAnalyze: () => void;
}

function BookmarkCard({ bm, onRemove }: { bm: Bookmark; onRemove: (id: string) => void }) {
  return (
    <div className="bg-white border border-border rounded-xl p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon name={getIcon(bm.type)} size={16} className="text-primary" fallback="Store" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-display font-semibold text-foreground text-sm leading-tight truncate">{bm.name}</p>
          <button
            onClick={() => onRemove(bm.id)}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
            title="Удалить закладку"
          >
            <Icon name="X" size={14} />
          </button>
        </div>
        {(() => {
          const typeLabel = bm.type.charAt(0).toUpperCase() + bm.type.slice(1);
          const spec = bm.profile && bm.profile.toLowerCase() !== bm.type.toLowerCase() ? bm.profile : "";
          return (
            <div className="flex items-center gap-1.5 mb-0.5 min-w-0 flex-wrap">
              <p className="text-xs text-primary font-body font-medium">{typeLabel}</p>
              {spec && (
                <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-body">{spec}</span>
              )}
              {bm.hours && (
                <span className="text-xs text-muted-foreground font-body flex items-center gap-0.5">
                  <Icon name="Clock" size={10} className="flex-shrink-0" />
                  {bm.hours.replace("Сегодня: ", "")}
                </span>
              )}
            </div>
          );
        })()}
        <div className="flex items-center gap-2 min-w-0">
          {(bm.city || bm.address) && (
            <p className="text-xs text-muted-foreground font-body flex items-center gap-1 truncate min-w-0">
              <Icon name="MapPin" size={10} className="flex-shrink-0" />
              <span className="truncate">{[bm.city, bm.address].filter(Boolean).join(", ")}</span>
            </p>
          )}
          <a
            href={`https://2gis.ru/search/${encodeURIComponent(bm.name + (bm.address ? ' ' + bm.address : ''))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 font-body flex items-center gap-1 flex-shrink-0 hover:underline"
          >
            <Icon name="ExternalLink" size={10} className="flex-shrink-0" />
            2GIS
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

function GroupCard({ group, onRemove }: { group: BookmarkGroup; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="MapPin" size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-semibold text-foreground leading-tight">{group.label}</p>
          <p className="text-xs text-muted-foreground font-body truncate">{group.cityLabel} · {group.bookmarks.length} {group.bookmarks.length === 1 ? "место" : group.bookmarks.length < 5 ? "места" : "мест"}</p>
        </div>
        <Icon
          name="ChevronDown"
          size={16}
          className={`text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="divide-y divide-border/60">
          {group.bookmarks.map((bm) => (
            <div key={bm.id} className="px-2 py-2">
              <BookmarkCard bm={bm} onRemove={onRemove} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NearbyBookmarks({ bookmarks, advice, adviceError, adviceLoading, onRemove, onAnalyze }: Props) {
  const useGroups = bookmarks.length > 3;
  const groups = useGroups ? groupBookmarks(bookmarks) : [];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Star" size={15} className="text-primary" />
        <span className="font-display font-semibold text-foreground text-sm">Избранное</span>
        {bookmarks.length > 0 && (
          <button
            onClick={onAnalyze}
            disabled={adviceLoading}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-body font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Icon name={adviceLoading ? "Loader" : "Sparkles"} size={13} className={adviceLoading ? "animate-spin" : ""} />
            {adviceLoading ? "Анализирую..." : "Что посетить сегодня?"}
          </button>
        )}
      </div>

      {(advice || adviceError) && (
        <div className={`mb-3 rounded-xl p-4 border ${adviceError ? "bg-red-50 border-red-200" : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"}`}>
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
      )}

      {bookmarks.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-5 text-center">
          <Icon name="BookmarkX" size={28} className="text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm font-body text-muted-foreground">Закладок пока нет</p>
          <p className="text-xs font-body text-muted-foreground/70 mt-1 max-w-xs mx-auto">
            Найдите объекты рядом и нажмите <Icon name="Bookmark" size={11} className="inline mx-0.5 relative -top-px" /> на карточке — место сохранится здесь до очистки кеша браузера
          </p>
        </div>
      ) : useGroups ? (
        <div className="space-y-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onRemove={onRemove} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {bookmarks.map((bm) => (
            <BookmarkCard key={bm.id} bm={bm} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
