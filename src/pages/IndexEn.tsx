import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber } from "./data";
import { loadNumbers } from "./AdminPage";
import { loadNumbersEn, PhoneNumberEn } from "./data-en";
import { Link } from "react-router-dom";
import { NumberModalEn } from "./EnSharedComponents";
import { EnHeroSection } from "./EnHeroSection";
import { EnDirectorySection } from "./EnDirectorySection";
import { EnInfoSection } from "./EnInfoSection";

export default function IndexEn() {
  const [selected, setSelected] = useState<{ ru: PhoneNumber; en: PhoneNumberEn | undefined } | null>(null);

  const ruNumbers = loadNumbers();
  const enNumbers = loadNumbersEn();

  function getEn(id: number) {
    return enNumbers.find((e) => e.id === id);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="font-display text-base font-bold text-black leading-tight tracking-wide">
                <span className="md:hidden">2407.rf</span>
                <span className="hidden md:inline">Short Phone Numbers of Russia "2407"</span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {(["Directory", "FAQ"] as const).map((label) => (
                <button
                  key={label}
                  className="px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors text-foreground hover:bg-muted"
                >
                  {label}
                </button>
              ))}
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

        <EnDirectorySection
          ruNumbers={ruNumbers}
          getEn={getEn}
          onSelect={(ru, en) => setSelected({ ru, en })}
        />

        <EnInfoSection />
      </main>

      <footer className="border-t border-border bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <span>short-number.rf / 2407.rf</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-foreground transition-colors">Русская версия</Link>
            <span>© 2026 · All numbers verified manually</span>
          </div>
        </div>
      </footer>

      {selected && (
        <NumberModalEn
          num={selected.ru}
          enNum={selected.en}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}