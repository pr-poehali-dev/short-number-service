import { useState } from "react";
import { PhoneNumber } from "./data";
import { Header, NumberModal } from "./SharedComponents";
import { ymGoal } from "@/lib/analytics";
import {
  HomeSection,
  DirectorySection,
  OperatorsSection,
  UniversalSection,
  FaqSection,
  NearbySection,
} from "./Sections";
import { FavoritesBar } from "./FavoritesBar";
import { useFavorites } from "./useFavorites";
import { loadNumbers } from "./AdminPage";

const DEFAULT_SECTION_COOKIE = "default_section";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

export default function Index() {
  const [section, setSection] = useState(() => {
    return getCookie(DEFAULT_SECTION_COOKIE) || "home";
  });
  const [selected, setSelected] = useState<PhoneNumber | null>(null);
  const [directoryCategory, setDirectoryCategory] = useState<string | undefined>(undefined);
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const ruNumbers = loadNumbers();

  function openById(id: number) {
    const num = ruNumbers.find((n) => n.id === id);
    if (num) setSelected(num);
  }

  const SECTION_GOALS: Record<string, string> = {
    home: "section_home",
    nearby: "section_nearby",
    directory: "section_directory",
    operators: "section_operators",
    universal: "section_universal",
    faq: "section_faq",
  };

  function handleNav(s: string, category?: string) {
    setCookie(DEFAULT_SECTION_COOKIE, s);
    setDirectoryCategory(category);
    setSection(s);
    ymGoal(SECTION_GOALS[s] ?? "section_unknown", category ? { category } : undefined);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={section} onNav={handleNav} />

      <main className="pb-12">
        {section === "home" && (
          <>
            <HomeSection onNav={handleNav} />
            <FavoritesBar favorites={favorites} onRemove={removeFavorite} onSelect={openById} />
          </>
        )}
        {section === "nearby" && <NearbySection />}
        {section === "directory" && <DirectorySection onSelect={setSelected} initialCategory={directoryCategory} />}
        {section === "operators" && <OperatorsSection onSelect={setSelected} />}
        {section === "universal" && <UniversalSection onSelect={setSelected} />}
        {section === "faq" && <FaqSection />}
      </main>

      <footer className="border-t border-border bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <span>{section === "nearby" ? "быстрый-ответ.рф / 2407.рф" : "короткий-номер.рф / 2407.рф"}</span>
          </div>
          <span>© 2026 · Все номера проверены вручную</span>
        </div>
      </footer>

      {selected && (
        <NumberModal
          num={selected}
          onClose={() => setSelected(null)}
          onAddFavorite={() => addFavorite(selected)}
          isFavorite={isFavorite(selected.id)}
        />
      )}
    </div>
  );
}