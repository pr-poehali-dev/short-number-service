import Icon from "@/components/ui/icon";
import { Place, getIcon, distanceColor } from "@/pages/nearby.types";
import { Bookmark } from "@/pages/nearby.types";

interface Props {
  status: "idle" | "locating" | "loading" | "done" | "error";
  sorted: Place[];
  hiddenCount: number;
  coords: { lat: number; lon: number } | null;
  errorMsg: string;
  rateLimited: boolean;
  remainingRequests: number | null;
  bookmarks: Bookmark[];
  savedId: string | null;
  onFind: () => void;
  onFindByAddress: () => void;
  onReset: () => void;
  onAddBookmark: (p: Place) => void;
  onOpenSettings: () => void;
  isBookmarked: (p: Place) => boolean;
  manualCoords: string;
  onManualCoordsChange: (v: string) => void;
  onFindByManualCoords: () => void;
  manualAddress: string;
  onManualAddressChange: (v: string) => void;
  city: string;
}

export function NearbyResults({
  status,
  sorted,
  hiddenCount,
  coords,
  errorMsg,
  rateLimited,
  remainingRequests,
  bookmarks,
  savedId,
  onFind,
  onFindByAddress,
  onReset,
  onAddBookmark,
  onOpenSettings,
  isBookmarked,
  manualCoords,
  onManualCoordsChange,
  onFindByManualCoords,
  manualAddress,
  onManualAddressChange,
  city,
}: Props) {
  return (
    <>
      {status === "idle" && (
        <div className="relative bg-white border border-border rounded-2xl p-8 text-center">
          <button
            onClick={onOpenSettings}
            className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-muted border border-border transition-colors text-xs font-body text-muted-foreground hover:text-foreground"
            title="Изменить город"
          >
            <Icon name="MapPin" size={13} className="text-primary flex-shrink-0" />
            <span>{city || "Город не задан"}</span>
          </button>
          <button
            onClick={onOpenSettings}
            className="absolute top-3 right-3 p-2 rounded-lg hover:bg-muted border border-border transition-colors"
            title="Настройки"
          >
            <Icon name="Settings2" size={18} className="text-muted-foreground" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="MapPin" size={32} className="text-primary" />
          </div>
          <h3 className="font-display text-xl font-bold text-foreground mb-2">Быстрый вопрос</h3>
          <p className="text-muted-foreground font-body text-sm mb-6 max-w-2xl mx-auto">Каждая сохраненная Вами закладка сделает быстрый ответ на вопрос "Что посетить сегодня?" точнее, а времяпрепровождение — интересным и полезным.</p>

          <div className="max-w-sm mx-auto space-y-3">
            {/* Поиск по геолокации */}
            <button
              onClick={onFind}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              <Icon name="LocateFixed" size={16} />
              Найти рядом со мной
            </button>

            {/* Разделитель */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-body">или введите адрес</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Поиск по адресу */}
            <div className="flex gap-2">
              <input
                type="text"
                value={manualAddress}
                onChange={e => onManualAddressChange(e.target.value)}
                placeholder="Улица и дом, например: ул. Ленина, 5"
                className="flex-1 text-sm border border-border rounded-xl px-3 py-2.5 font-body bg-white focus:outline-none focus:border-primary"
                onKeyDown={e => e.key === 'Enter' && manualAddress.trim() && onFindByAddress()}
              />
              <button
                onClick={onFindByAddress}
                disabled={!manualAddress.trim()}
                className="px-3 py-2.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                <Icon name="Search" size={16} />
              </button>
            </div>

            {remainingRequests !== null && (
              <p className={`text-xs font-body text-center ${remainingRequests <= 1 ? "text-amber-600" : "text-muted-foreground"}`}>
                Осталось запросов сегодня: <span className="font-semibold">{remainingRequests} из 5</span>
              </p>
            )}
          </div>
        </div>
      )}

      {(status === "locating" || status === "loading") && (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-body text-foreground font-semibold">
            {status === "locating" ? "Определяем местоположение…" : "Ищем объекты рядом…"}
          </p>
          {status === "loading" && (
            <p className="text-sm text-muted-foreground font-body mt-1">Это может занять 5–15 секунд</p>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="relative bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <button
            onClick={onReset}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
            title="Закрыть"
          >
            <Icon name="X" size={16} />
          </button>
          {rateLimited ? (
            <>
              <Icon name="Clock" size={32} className="text-amber-500 mx-auto mb-3" />
              <p className="font-body text-red-700 font-semibold mb-1">{errorMsg}</p>
              <p className="text-sm text-red-500 font-body mb-4">Лимит сбрасывается в полночь по московскому времени.</p>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-muted text-foreground rounded-xl font-body font-semibold hover:bg-muted/80 transition-colors text-sm border border-border"
              >
                <Icon name="ArrowLeft" size={15} />
                Вернуться назад
              </button>
            </>
          ) : (
            <>
              <Icon name="AlertCircle" size={32} className="text-red-500 mx-auto mb-3" />
              <p className="font-body text-red-700 font-semibold mb-4">{errorMsg}</p>
              <button
                onClick={onFind}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors text-sm"
              >
                <Icon name="RefreshCw" size={15} />
                Попробовать снова
              </button>
            </>
          )}
          <div className="mt-5 pt-5 border-t border-red-200">
            <p className="text-xs text-red-500 font-body mb-2">Или введите координаты вручную (можно скопировать из Яндекс.Карт)</p>
            <div className="flex gap-2 max-w-xs mx-auto">
              <input
                type="text"
                value={manualCoords}
                onChange={e => onManualCoordsChange(e.target.value)}
                placeholder="59.9311, 30.3609"
                className="flex-1 text-sm border border-red-200 rounded-lg px-3 py-2 font-body bg-white focus:outline-none focus:border-primary"
                onKeyDown={e => e.key === 'Enter' && onFindByManualCoords()}
              />
              <button
                onClick={onFindByManualCoords}
                disabled={!manualCoords.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-body font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                <Icon name="Search" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "done" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="CheckCircle" size={16} className="text-green-600" />
              <span className="text-sm font-body text-muted-foreground">
                Найдено: <strong className="text-foreground">{sorted.length}</strong>
              </span>
              {hiddenCount > 0 && (
                <span className="ml-1.5 text-xs text-primary/70 font-body">
                  · ещё {hiddenCount} в избранном
                </span>
              )}
              {remainingRequests !== null && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-body font-medium border ${
                  remainingRequests <= 1
                    ? "text-amber-700 bg-amber-50 border-amber-200"
                    : "text-muted-foreground bg-muted border-border"
                }`}>
                  Осталось: {remainingRequests}/5
                </span>
              )}
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-body hover:bg-muted transition-colors"
            >
              <Icon name="X" size={14} />
              Сбросить
            </button>
          </div>

          <div className="space-y-3">
            {sorted.map((p, i) => {
              const alreadySaved = isBookmarked(p);
              const justSaved = savedId !== null && bookmarks.find(b => b.id === savedId)?.name === p.name;
              return (
                <div key={i} className="bg-white border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={getIcon(p.type)} size={20} className="text-primary" fallback="Store" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">{p.name}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-body font-medium border ${distanceColor(p.distance_approx)}`}>
                          ~{p.distance_approx} м
                        </span>
                        <button
                          onClick={() => !alreadySaved && onAddBookmark(p)}
                          disabled={alreadySaved}
                          title={alreadySaved ? "Уже в закладках" : "Сохранить в закладки"}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                            alreadySaved
                              ? "text-primary bg-primary/10 cursor-default"
                              : "text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border"
                          }`}
                        >
                          <Icon name={justSaved || alreadySaved ? "BookmarkCheck" : "Bookmark"} size={14} />
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const typeLabel = p.type.charAt(0).toUpperCase() + p.type.slice(1);
                      const spec = p.profile && p.profile.toLowerCase() !== p.type.toLowerCase() ? p.profile : "";
                      return (
                        <div className="flex items-center gap-1.5 mb-0.5 min-w-0 flex-wrap">
                          <p className="text-xs text-primary font-body font-medium">{typeLabel}</p>
                          {spec && (
                            <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-body">{spec}</span>
                          )}
                          {p.hours && (
                            <span className="text-xs text-muted-foreground font-body flex items-center gap-0.5">
                              <Icon name="Clock" size={10} className="flex-shrink-0" />
                              {p.hours.replace("Сегодня: ", "")}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-2 min-w-0">
                      {(p.city || p.address) && (
                        <p className="text-xs text-muted-foreground font-body flex items-center gap-1 truncate min-w-0">
                          <Icon name="MapPin" size={10} className="flex-shrink-0" />
                          <span className="truncate">
                            {[p.city, p.address].filter(Boolean).join(", ")}
                          </span>
                        </p>
                      )}
                      <a
                        href={`https://2gis.ru/search/${encodeURIComponent(p.name + (p.address ? ' ' + p.address : ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-body flex-shrink-0 hover:underline"
                      >
                        <Icon name="ExternalLink" size={11} />
                        2GIS
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
