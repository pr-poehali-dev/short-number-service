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

export const EXAMPLE_BOOKMARK: Bookmark = {
  id: "example_1",
  savedAt: "2026-04-20T10:30:00.000Z",
  lat: 55.7558,
  lon: 37.6173,
  name: "Кафе «Уют»",
  type: "кафе",
  description: "Уютное кафе с домашней кухней и свежей выпечкой. Работает с 8:00 до 22:00.",
  distance_approx: 120,
  city: "Москва",
  address: "ул. Тверская, 14",
  label: "кафе",
  profile: "завтраки, для семей",
  hours: "08:00–22:00",
};

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
    const stored = JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
    if (stored.length === 0) return [EXAMPLE_BOOKMARK];
    return stored;
  } catch {
    return [EXAMPLE_BOOKMARK];
  }
}

export function saveBookmarks(bms: Bookmark[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bms));
}