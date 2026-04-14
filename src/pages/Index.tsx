import { useState, useEffect } from "react";
import { PhoneNumber } from "./data";
import { Header, NumberModal } from "./SharedComponents";
import {
  HomeSection,
  DirectorySection,
  OperatorsSection,
  UniversalSection,
  FaqSection,
  NearbySection,
} from "./Sections";

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

  function handleNav(s: string) {
    setSection(s);
  }

  function setAsDefault(s: string) {
    setCookie(DEFAULT_SECTION_COOKIE, s);
    setSection(s);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={section} onNav={handleNav} onSetDefault={setAsDefault} />

      <main className="pb-12">
        {section === "home" && <HomeSection onNav={handleNav} />}
        {section === "nearby" && <NearbySection />}
        {section === "directory" && <DirectorySection onSelect={setSelected} />}
        {section === "operators" && <OperatorsSection onSelect={setSelected} />}
        {section === "universal" && <UniversalSection onSelect={setSelected} />}
        {section === "faq" && <FaqSection />}
      </main>

      <footer className="border-t border-border bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <span>короткий-номер.рф / 2407.рф</span>
          </div>
          <span>© 2026 · Все номера проверены вручную</span>
        </div>
      </footer>

      {selected && (
        <NumberModal num={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
