import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

// Browser-only state: assigned only inside effects and event handlers.
let currentTheme: Theme | null = null;
const listeners = new Set<(t: Theme) => void>();

function ensureTheme(): Theme {
  if (currentTheme === null) {
    currentTheme = getInitialTheme();
    applyTheme(currentTheme);
  }
  return currentTheme;
}

function setGlobalTheme(theme: Theme) {
  currentTheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l(theme));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(ensureTheme());
    listeners.add(setTheme);
    return () => { listeners.delete(setTheme); };
  }, []);

  function toggleTheme() {
    setGlobalTheme(ensureTheme() === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}
