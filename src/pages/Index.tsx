import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber } from "./data";
import { Header, NumberModal } from "./SharedComponents";
import {
  HomeSection,
  DirectorySection,
  OperatorsSection,
  UniversalSection,
  ProceduresSection,
  FaqSection,
  ContactsSection,
} from "./Sections";

export default function Index() {
  const [section, setSection] = useState("home");
  const [selected, setSelected] = useState<PhoneNumber | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={section} onNav={setSection} />

      <main className="pb-12">
        {section === "home" && <HomeSection onNav={setSection} />}
        {section === "directory" && <DirectorySection onSelect={setSelected} />}
        {section === "operators" && <OperatorsSection onSelect={setSelected} />}
        {section === "universal" && <UniversalSection onSelect={setSelected} />}
        {section === "faq" && <FaqSection />}
      </main>

      <footer className="border-t border-border bg-white py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground font-body">
          <div className="flex items-center gap-2">
            <Icon name="Hash" size={16} className="text-primary" />
            <span className="font-display font-semibold text-foreground">
              короткий-комер.рф
            </span>
            <span>— справочник коротких номеров</span>
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
