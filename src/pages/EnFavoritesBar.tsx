import Icon from "@/components/ui/icon";
import { FavoriteEn } from "./useFavoritesEn";

interface Props {
  favorites: FavoriteEn[];
  onRemove: (id: number) => void;
  onSelect: (id: number) => void;
}

export function EnFavoritesBar({ favorites, onRemove, onSelect }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-5 pb-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon name="Star" size={15} className="text-primary" />
        <span className="font-display font-semibold text-foreground text-sm">Favorites</span>
        <span className="text-xs font-body text-muted-foreground ml-auto">max 6</span>
      </div>

      {favorites.length === 0 ? (
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
          <Icon name="Star" size={24} className="text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-sm font-body text-muted-foreground">No favorites yet</p>
          <p className="text-xs font-body text-muted-foreground/60 mt-0.5">
            Open a number card and tap <Icon name="Plus" size={11} className="inline mx-0.5 relative -top-px" /> to save here. Up to 6 numbers.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="flex items-center gap-1.5 pl-3 pr-1 py-1.5 bg-white border border-border rounded-lg shadow-sm hover:border-primary/40 transition-colors cursor-pointer group"
            >
              <button
                onClick={() => onSelect(fav.id)}
                className="flex items-center gap-1.5 text-sm font-body font-medium text-foreground"
              >
                <span className="font-display font-bold text-primary text-xs">{fav.number}</span>
                <span className="truncate max-w-[120px]">{fav.name}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(fav.id); }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors flex-shrink-0"
                title="Remove"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
