export interface Place {
  name: string;
  type: string;
  description: string;
  distance_approx: number;
  address?: string;
  city?: string;
  label?: string;
  profile?: string;
  hours?: string;
}

export interface Bookmark {
  id: string;
  savedAt: string;
  lat: number;
  lon: number;
  name: string;
  type: string;
  description: string;
  distance_approx: number;
  address: string;
  city?: string;
  label: string;
  profile: string;
  hours?: string;
}

export const TYPE_ICONS: Record<string, string> = {
  "магазин": "ShoppingBag",
  "аптека": "Pill",
  "кафе": "Coffee",
  "ресторан": "UtensilsCrossed",
  "банк": "Building2",
  "банкомат": "CreditCard",
  "салон": "Scissors",
  "сервис": "Wrench",
  "парикмахерская": "Scissors",
  "супермаркет": "ShoppingCart",
  "почта": "Mail",
  "больница": "Hospital",
  "клиника": "Hospital",
  "стоматология": "Hospital",
  "спортзал": "Dumbbell",
  "фитнес": "Dumbbell",
  "заправка": "Fuel",
  "автосервис": "Car",
  "прачечная": "WashingMachine",
  "химчистка": "WashingMachine",
  "цветы": "Flower2",
  "ювелирный": "Gem",
  "оптика": "Glasses",
};

export function getIcon(type: string): string {
  const lower = type.toLowerCase();
  for (const key of Object.keys(TYPE_ICONS)) {
    if (lower.includes(key)) return TYPE_ICONS[key];
  }
  return "Store";
}

export function distanceColor(d: number): string {
  if (d <= 100) return "text-green-600 bg-green-50 border-green-200";
  if (d <= 200) return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-orange-600 bg-orange-50 border-orange-200";
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export const BOOKMARKS_KEY = "nearby_bookmarks";
export const BOOKMARK_VIEW_KEY = "nearby_bookmark_view";
export const COLLECTIONS_KEY = "nearby_collections";

export type BookmarkView = "default" | "distance" | "type" | "collections";

export interface BookmarkCollection {
  id: string;
  name: string;
  color: string;
  bookmarkIds: string[];
  createdAt: string;
}

export const COLLECTION_COLORS = [
  { id: "blue",   bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200"   },
  { id: "green",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200"  },
  { id: "amber",  bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-200"  },
  { id: "rose",   bg: "bg-rose-100",   text: "text-rose-700",   border: "border-rose-200"   },
  { id: "violet", bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
];

export function loadCollections(): BookmarkCollection[] {
  try { return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || "[]"); } catch { return []; }
}

export function saveCollections(cols: BookmarkCollection[]) {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(cols));
}

export function groupByType(bookmarks: Bookmark[]): { type: string; bookmarks: Bookmark[] }[] {
  const map: Record<string, Bookmark[]> = {};
  for (const bm of bookmarks) {
    const key = bm.type || "место";
    if (!map[key]) map[key] = [];
    map[key].push(bm);
  }
  return Object.entries(map)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([type, bms]) => ({ type, bookmarks: bms }));
}

export function sortByDistance(
  bookmarks: Bookmark[],
  userLat: number,
  userLon: number
): Bookmark[] {
  return [...bookmarks].sort((a, b) => {
    const da = haversineKm(userLat, userLon, a.lat, a.lon);
    const db = haversineKm(userLat, userLon, b.lat, b.lon);
    return da - db;
  });
}


export interface BookmarkGroup {
  id: string;
  date: string;
  label: string;
  center: { lat: number; lon: number };
  cityLabel: string;
  bookmarks: Bookmark[];
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}

function formatGroupLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameDay(d, today)) return "Сегодня";
  if (sameDay(d, yesterday)) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export function groupBookmarks(bookmarks: Bookmark[]): BookmarkGroup[] {
  const sorted = [...bookmarks].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  const groups: BookmarkGroup[] = [];

  for (const bm of sorted) {
    const day = dayKey(bm.savedAt);
    const matched = groups.find((g) => {
      if (dayKey(g.bookmarks[0].savedAt) !== day) return false;
      return haversineKm(g.center.lat, g.center.lon, bm.lat, bm.lon) <= 1.0;
    });

    if (matched) {
      matched.bookmarks.push(bm);
      matched.center = {
        lat: matched.bookmarks.reduce((s, b) => s + b.lat, 0) / matched.bookmarks.length,
        lon: matched.bookmarks.reduce((s, b) => s + b.lon, 0) / matched.bookmarks.length,
      };
    } else {
      const cityLabel = bm.city || bm.address?.split(",")[0] || "Неизвестное место";
      groups.push({
        id: `${day}-${bm.lat.toFixed(3)}-${bm.lon.toFixed(3)}`,
        date: bm.savedAt,
        label: formatGroupLabel(bm.savedAt),
        center: { lat: bm.lat, lon: bm.lon },
        cityLabel,
        bookmarks: [bm],
      });
    }
  }

  return groups;
}

export function loadBookmarks(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveBookmarks(bms: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bms));
}