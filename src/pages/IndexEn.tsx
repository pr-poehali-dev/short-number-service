import { useState, useEffect } from "react";
import { PhoneNumber, NUMBERS } from "./data";
import { PhoneNumberEn, NUMBERS_EN_DEFAULT } from "./data-en";

const NEARBY_URL = "https://functions.poehali.dev/d4b08b1e-6bd7-4d3b-81cf-02b5e4c6447f";

import { Link } from "react-router-dom";
import { NumberModalEn } from "./EnSharedComponents";
import { EnHeroSection } from "./EnHeroSection";
import { EnDirectorySection } from "./EnDirectorySection";
import { EnInfoSection } from "./EnInfoSection";
import { EnFavoritesBar } from "./EnFavoritesBar";
import { useFavoritesEn } from "./useFavoritesEn";

export default function IndexEn() {
  const [selected, setSelected] = useState<{ ru: PhoneNumber; en: PhoneNumberEn | undefined } | null>(null);
  const [ruNumbers, setRuNumbers] = useState<PhoneNumber[]>(NUMBERS);
  const [enNumbers, setEnNumbers] = useState<PhoneNumberEn[]>(NUMBERS_EN_DEFAULT);
  const { favorites, addFavorite, removeFavorite, isFavorite, maxReached } = useFavoritesEn();

  useEffect(() => {
    fetch(NEARBY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "get_numbers" }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.numbers?.length) setRuNumbers(data.numbers); })
      .catch(() => {});

    fetch(NEARBY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "get_numbers_en" }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.numbers?.length) setEnNumbers(data.numbers); })
      .catch(() => {});
  }, []);

  function getEn(id: number) {
    return enNumbers.find((e) => e.id === id);
  }

  function openById(id: number) {
    const ru = ruNumbers.find((n) => n.id === id);
    if (!ru) return;
    const en = getEn(id);
    setSelected({ ru, en });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="font-display text-base font-bold text-black leading-tight tracking-wide">
                <span className="md:hidden">2407.rf</span>
                <span className="hidden md:inline">Short Numbers of Russia "2407"</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">


            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-body font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >RU</Link>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-body font-semibold text-primary bg-primary/10">
                EN
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-12">
        <EnHeroSection />

        <EnFavoritesBar
          favorites={favorites}
          onRemove={removeFavorite}
          onSelect={openById}
        />

        <EnDirectorySection
          ruNumbers={ruNumbers}
          getEn={getEn}
          onSelect={(ru, en) => setSelected({ ru, en })}
        />

      </main>

      <footer className="border-t border-border bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <span>short-number.rf / 2407.rf</span>
          </div>
          <span>© 2026 · All numbers verified manually</span>
        </div>
        <div className="max-w-6xl mx-auto border-t border-border mt-4 pt-4 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground font-body">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
            <a href="/terms" className="hover:text-foreground transition-colors">Terms of Use</a>
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</a>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-x-4 gap-y-1 text-center md:text-right">
            <span>© MEDIA-INCODE LLC, 2026</span>
            <a href="mailto:support@incode.ru" className="hover:text-foreground transition-colors">support@incode.ru</a>
          </div>
        </div>
      </footer>

      {selected && (
        <NumberModalEn
          num={selected.ru}
          enNum={selected.en}
          onClose={() => setSelected(null)}
          onAddFavorite={() => addFavorite(selected.ru, selected.en)}
          isFavorite={isFavorite(selected.ru.id)}
          maxReached={maxReached}
        />
      )}
    </div>
  );
}