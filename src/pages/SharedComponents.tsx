import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber, Operator, OPERATOR_COLORS } from "./data";

export function OperatorBadge({ operator }: { operator: Operator }) {
  const c = OPERATOR_COLORS[operator];
  return (
    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {operator}
    </span>
  );
}

export function NumberCard({ num, onClick }: { num: PhoneNumber; onClick: (n: PhoneNumber) => void }) {
  return (
    <button
      onClick={() => onClick(num)}
      className="number-card w-full text-left bg-white border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer"
    >
      <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
        <span className="font-display font-bold text-white text-sm leading-tight text-center px-1">{num.number}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-foreground text-base leading-tight">{num.name}</h3>
          <OperatorBadge operator={num.operator} />
        </div>
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{num.description}</p>
      </div>
    </button>
  );
}

export function NumberModal({ num, onClose }: { num: PhoneNumber; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-white text-xl">{num.number}</span>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-1">{num.name}</h2>
              <OperatorBadge operator={num.operator} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Описание</p>
            <p className="text-foreground font-body leading-relaxed">{num.description}</p>
          </div>
          {num.procedure && (
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-sm font-body font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Icon name="Info" size={14} /> Как воспользоваться
              </p>
              <p className="text-sm text-blue-800 font-body">{num.procedure}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-body text-muted-foreground">Категория:</span>
            <span className="text-sm font-body font-semibold text-foreground">{num.category}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <a
            href={`tel:${num.number}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="Phone" size={18} /> Позвонить: {num.number}
          </a>
        </div>
      </div>
    </div>
  );
}

export function InstallModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
              <span className="font-display text-white leading-tight text-center text-base font-light">2407</span>
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-lg leading-tight">2407.рф</h3>
              <p className="text-xs text-muted-foreground font-body">Справочник коротких номеров</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        <p className="text-sm font-body text-muted-foreground mb-4">Добавьте ярлык на домашний экран — открывать сайт станет так же удобно, как обычное приложение.</p>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <p className="text-sm font-body font-semibold text-blue-800 mb-1.5 flex items-center gap-1.5">
              <Icon name="Apple" size={14} /> iOS (Safari)
            </p>
            <ol className="text-sm text-blue-700 font-body space-y-1 list-decimal list-inside">
              <li>Нажмите кнопку «Поделиться» внизу экрана</li>
              <li>Выберите «На экран "Домой"»</li>
              <li>Нажмите «Добавить»</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
            <p className="text-sm font-body font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
              <Icon name="Smartphone" size={14} /> Android (Chrome)
            </p>
            <ol className="text-sm text-green-700 font-body space-y-1 list-decimal list-inside">
              <li>Нажмите меню <strong>⋮</strong> в правом верхнем углу</li>
              <li>Выберите «Добавить на главный экран»</li>
              <li>Подтвердите добавление</li>
            </ol>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground font-body mt-4">Ярлык будет называться <strong>«2407.рф»</strong></p>
      </div>
    </div>
  );
}

export function Header({ activeSection, onNav }: { activeSection: string; onNav: (s: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  const navItems = [
    { id: "home",       label: "Главная" },
    { id: "directory",  label: "Справочник" },
    { id: "operators",  label: "По операторам" },
    { id: "universal",  label: "Универсальные" },
    { id: "faq",        label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNav("home")} className="flex items-center gap-2">

            <div className="font-display text-base font-bold text-black leading-tight tracking-wide">Справочник коротких номеров России "2407"</div>
          </button>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNav(item.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-body font-medium transition-colors ${
                  activeSection === item.id ? "bg-primary text-white" : "text-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInstallOpen(true)}
              title="Добавить на домашний экран"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-body font-medium"
            >
              <Icon name="Plus" size={15} />
              <span className="hidden sm:inline">На экран</span>
            </button>
            <button className="lg:hidden p-2 rounded-md hover:bg-muted" onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>
      </div>

      {installOpen && <InstallModal onClose={() => setInstallOpen(false)} />}

      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-white">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNav(item.id); setMenuOpen(false); }}
              className={`w-full text-left px-5 py-3 text-sm font-body font-medium transition-colors ${
                activeSection === item.id ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}