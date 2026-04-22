import { useState, useEffect } from "react";
import { PhoneNumber } from "./data";
import { PhoneNumberEn } from "./data-en";

export interface FavoriteEn {
  id: number;
  number: string;
  name: string;
}

const STORAGE_KEY = "favorites";
const MAX_FAVORITES = 6;

function load(): FavoriteEn[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function useFavoritesEn() {
  const [favorites, setFavorites] = useState<FavoriteEn[]>(() => load());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  function addFavorite(num: PhoneNumber, enNum: PhoneNumberEn | undefined) {
    if (favorites.length >= MAX_FAVORITES) return;
    if (favorites.find((f) => f.id === num.id)) return;
    const name = enNum?.name ?? num.name;
    setFavorites((prev) => [...prev, { id: num.id, number: num.number, name }]);
  }

  function removeFavorite(id: number) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  function isFavorite(id: number) {
    return favorites.some((f) => f.id === id);
  }

  return { favorites, addFavorite, removeFavorite, isFavorite, maxReached: favorites.length >= MAX_FAVORITES };
}