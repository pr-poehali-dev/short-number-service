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

let currentTheme: Theme = getInitialTheme();
applyTheme(currentTheme);
const listeners = new Set<(t: Theme) => void>();

function setGlobalTheme(theme: Theme) {
  currentTheme = theme;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l(theme));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    listeners.add(setTheme);
    return () => { listeners.delete(setTheme); };
  }, []);

  function toggleTheme() {
    setGlobalTheme(currentTheme === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}
