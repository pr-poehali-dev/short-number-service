export interface Place {
  name: string;
  type: string;
  description: string;
  distance_approx: number;
  address?: string;
  city?: string;
  label?: string;
  profile?: string;
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
  address: "ул. Тверская, 14",
  label: "Еда",
  profile: "для семей, завтраки",
};

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