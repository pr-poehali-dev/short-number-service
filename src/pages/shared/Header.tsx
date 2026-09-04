import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { ServiceStatusBanner } from "@/components/ServiceStatusBanner";
import ThemeToggle from "@/components/ThemeToggle";
import { InstallModal, BeforeInstallPromptEvent } from "./InstallModal";

export function Header({
  activeSection,
  onNav,
}: {
  activeSection: string;
  onNav: (s: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [pwaPrompt, setPwaPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAdminAuthed, setIsAdminAuthed] = useState(() => sessionStorage.getItem("admin_auth_v1") === "1");
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const A2HS_BANNER_KEY = "a2hs_banner_shown";

  useEffect(() => {
    if (window.innerWidth >= 640) return;
    if (localStorage.getItem(A2HS_BANNER_KEY)) return;
    const handleFirstTouch = () => {
      localStorage.setItem(A2HS_BANNER_KEY, "1");
      setInstallOpen(true);
    };
    document.addEventListener("touchstart", handleFirstTouch, { once: true, passive: true });
    return () => document.removeEventListener("touchstart", handleFirstTouch);
  }, []);

  function handleNav(section: string) {
    onNav(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleLogoTap() {
    handleNav("home");
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      navigate("/admin-2407");
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
    }
  }

  useEffect(() => {
    const check = () => setIsAdminAuthed(sessionStorage.getItem("admin_auth_v1") === "1");
    window.addEventListener("focus", check);
    window.addEventListener("popstate", check);
    const id = setInterval(check, 1000);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("popstate", check);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const navItems = [
    { id: "directory",  label: "Справочник" },
    { id: "nearby",     label: "Быстрые ответы" },
    { id: "faq",        label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <ServiceStatusBanner />
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex items-center justify-between h-16 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <button onClick={handleLogoTap} className="flex items-center gap-2 justify-self-start relative">
            <div className="font-display text-base font-bold text-foreground leading-tight tracking-wide">
              <span className="md:hidden">2407.рф</span>
              <span className="hidden md:inline">Короткие номера России "2407"</span>
            </div>
            {isAdminAuthed && (
              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-green-500 shadow-sm" title="Админ-режим активен" />
            )}
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors ${
                  activeSection === item.id ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {(activeSection === "directory" || activeSection === "nearby") && (
            <button
              onClick={() => handleNav(activeSection === "directory" ? "nearby" : "directory")}
              className="md:hidden absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-md text-sm font-body font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              {activeSection === "directory" ? "Быстрый ответ" : "Справочник"}
            </button>
          )}

          <div className="flex items-center gap-2 justify-self-end">
            {activeSection !== "nearby" && (
              <Link
                to="/en"
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-body font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                EN
              </Link>
            )}
            <button
              onClick={() => setInstallOpen(true)}
              title="Добавить на домашний экран"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-body font-medium"
            >
              <Icon name="Plus" size={15} />
              <span>2407.РФ</span>
            </button>
            <ThemeToggle />
            <button className="md:hidden p-2 rounded-md hover:bg-muted" onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>
      </div>

      {installOpen && <InstallModal onClose={() => setInstallOpen(false)} pwaPrompt={pwaPrompt} />}

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { handleNav(item.id); setMenuOpen(false); }}
              className={`w-full text-left px-5 py-3 text-sm font-body font-medium transition-colors ${
                activeSection === item.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
          {activeSection === "directory" && (
            <Link
              to="/en"
              onClick={() => setMenuOpen(false)}
              className="w-full flex items-center gap-2 px-5 py-3 text-sm font-body font-medium text-muted-foreground hover:bg-muted transition-colors border-t border-border"
            >
              <span className="text-xs">🌐</span>
              English version
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
