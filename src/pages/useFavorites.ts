import { useState, useEffect } from "react";
import { PhoneNumber } from "./data";

export interface Favorite {
  id: number;
  number: string;
  name: string;
}

const STORAGE_KEY = "favorites";
export const FAVORITES_BAR_LIMIT = 6;

function load(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setFavorites(load());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites, loaded]);

  function addFavorite(num: PhoneNumber) {
    if (favorites.find((f) => f.id === num.id)) return;
    setFavorites((prev) => [...prev, { id: num.id, number: num.number, name: num.name }]);
  }

  function removeFavorite(id: number) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  function isFavorite(id: number) {
    return favorites.some((f) => f.id === id);
  }

  return { favorites, addFavorite, removeFavorite, isFavorite, maxReached: false };
}