import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { PhoneNumber, Operator, OPERATOR_COLORS } from "./data";
import { ymGoal } from "@/lib/analytics";
import { ServiceStatusBanner } from "@/components/ServiceStatusBanner";


interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function OperatorBadge({ operator }: { operator: Operator }) {
  if (operator === "Универсальный") return null;
  const c = OPERATOR_COLORS[operator];
  return (
    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {operator}
    </span>
  );
}

const isShortNumber = (n: string) => n.replace(/\D/g, "").length <= 4;

export function NumberCard({ num, onClick }: { num: PhoneNumber; onClick: (n: PhoneNumber) => void }) {
  const short = isShortNumber(num.number);
  return (
    <button
      onClick={() => { onClick(num); ymGoal("card_open", { number: num.number, name: num.name, category: num.category, operator: num.operator }); }}
      className="number-card w-full text-left bg-white border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer"
    >
      {short ? (
        <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-white text-sm leading-tight text-center px-1">{num.number}</span>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="Phone" size={22} className="text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">{num.name}</h3>
          {(num.operator === "МТС" || num.operator === "Билайн" || num.operator === "МегаФон" || num.operator === "Т2") && (() => {
            const c = OPERATOR_COLORS[num.operator];
            return (
              <span className={`flex-shrink-0 inline-flex items-center gap-1 text-xs ${c.text} ${c.bg} ${c.border} border rounded-full px-2 py-0.5 font-body`}>
                <Icon name="Signal" size={11} /> Только с {num.operator}
              </span>
            );
          })()}
        </div>
        {!short && (
          <p className="font-display font-bold text-primary text-sm mb-1 tracking-wide">{num.number}</p>
        )}
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{num.description}</p>
        {num.category === "Коммерческие" && (
          <div className="mt-1.5">
            {num.deviceAccess === "any" ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 font-body">
                <Icon name="CheckCircle" size={11} /> Смартфон и телефон
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-body">
                <Icon name="Smartphone" size={11} /> Смартфон
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}

function generateContactPhoto(number: string): string {
  const size = 240;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#1a3a6b");
  grad.addColorStop(1, "#0066cc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.beginPath();
  ctx.arc(size * 0.85, size * 0.15, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  const digits = number.replace(/\D/g, "");
  const fontSize = digits.length <= 3 ? 88 : digits.length <= 4 ? 76 : 58;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(number, size / 2, size / 2);

  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

function generateVCard(num: PhoneNumber): string {
  const photo = generateContactPhoto(num.number);
  const photoLine = `PHOTO;ENCODING=b;TYPE=JPEG:${photo}`;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${num.name}`,
    `N:${num.name};;;;`,
    `TEL;TYPE=CELL:${num.number}`,
    `ORG:${num.organization ?? "Справочник 2407.рф"}`,
    `CATEGORIES:${num.category}`,
    `NOTE:${num.description.replace(/\n/g, "\\n")} | Оператор: ${num.operator}`,
    "URL:2407.рф",
    photoLine,
    "END:VCARD",
  ];
  return lines.join("\r\n");
}

function saveVCard(num: PhoneNumber) {
  const vcardStr = generateVCard(num);
  const blob = new Blob([vcardStr], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${num.number}_${num.name.replace(/[^a-zA-Zа-яА-Я0-9]/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function NumberModal({ num, onClose, onAddFavorite, isFavorite, maxReached }: { num: PhoneNumber; onClose: () => void; onAddFavorite?: () => void; isFavorite?: boolean; maxReached?: boolean }) {
  const short = isShortNumber(num.number);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `${num.name} — ${num.number}\n${num.description}\n\n📞 Справочник «2407.рф»`;
    if (navigator.share) {
      await navigator.share({ text });
      ymGoal("share_native", { number: num.number });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      ymGoal("share_copy", { number: num.number });
      setTimeout(() => setCopied(false), 2000);
    }
  }
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
            {short ? (
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-white text-xl">{num.number}</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name="Phone" size={26} className="text-primary" />
              </div>
            )}
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-0.5">{num.name}</h2>
              {!short && (
                <p className="font-display font-bold text-primary text-base tracking-wide mb-0.5">{num.number}</p>
              )}

            </div>
          </div>
          <div className="flex items-center gap-1">
            {onAddFavorite && (
              <button
                onClick={onAddFavorite}
                disabled={isFavorite || maxReached}
                className="p-2 rounded-lg hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-default transition-colors"
                title={isFavorite ? "Уже в избранном" : maxReached ? "Избранное заполнено (макс. 6)" : "Добавить в избранное"}
              >
                <Icon name="Star" size={18} className={isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
              <Icon name="X" size={18} className="text-muted-foreground" />
            </button>
          </div>
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
          {num.category === "Коммерческие" && (
            <div className="flex items-center gap-2 flex-wrap">
              {num.deviceAccess === "any" ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 font-body">
                  <Icon name="CheckCircle" size={13} /> Доступен со смартфона и с обычного телефона
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 font-body">
                  <Icon name="Smartphone" size={13} /> Только со смартфона (номер со звёздочкой)
                </span>
              )}
            </div>
          )}
          {(num.operator === "МТС" || num.operator === "Билайн" || num.operator === "МегаФон" || num.operator === "Т2") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 font-body">
                <Icon name="Signal" size={13} /> Только с {num.operator}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 font-body">
                <Icon name="Smartphone" size={13} /> Смартфон
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-body text-muted-foreground">Категория:</span>
            <span className="text-sm font-body font-semibold text-foreground">{num.category}</span>
            <span className="text-muted-foreground/40 text-sm hidden sm:inline">·</span>
            <span className="w-full sm:w-auto" />
            <span className="text-sm font-body text-muted-foreground">Предложено:</span>
            <span className="text-sm font-body font-semibold text-foreground">{num.suggestedBy ?? 'Справочник "2407"'}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border flex gap-2">
          <a
            href={`tel:${num.number}`}
            onClick={() => ymGoal("call_click", { number: num.number, name: num.name, category: num.category, operator: num.operator })}
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary text-white rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="Phone" size={18} />
            <span className="hidden sm:inline">Позвонить</span>
          </a>
          <button
            onClick={() => { saveVCard(num); ymGoal("vcard_save", { number: num.number, name: num.name }); }}
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-white border-2 border-primary text-primary rounded-xl font-body font-semibold hover:bg-primary/5 transition-colors"
          >
            <Icon name="UserPlus" size={18} />
            <span className="hidden sm:inline">Сохранить</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-12 h-12 my-auto bg-white text-muted-foreground rounded-xl hover:text-primary transition-colors flex-shrink-0"
            title={copied ? "Скопировано!" : "Поделиться"}
          >
            <Icon name={copied ? "Check" : "Share2"} size={18} className={copied ? "text-green-500" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function InstallModal({ onClose, pwaPrompt }: { onClose: () => void; pwaPrompt?: BeforeInstallPromptEvent | null }) {
  const handlePwaInstall = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    await pwaPrompt.userChoice;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-primary/20 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden bg-white">
              <img src="https://cdn.poehali.dev/files/7bcf9c89-8cb9-48db-a7ac-f8b6902960bd.png" alt="2407" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-lg leading-tight">Справочник</h3>
              <p className="text-xs text-muted-foreground font-body">Работает, как приложение.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {pwaPrompt && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-body font-semibold text-foreground mb-1 flex items-center gap-2">
              <Icon name="Download" size={15} className="text-primary" /> Установить как приложение
            </p>
            <p className="text-xs text-muted-foreground font-body mb-3">Работает без интернета, открывается без браузера — как обычное приложение.</p>
            <button
              onClick={handlePwaInstall}
              className="w-full bg-primary text-white rounded-lg py-2 text-sm font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              Установить приложение
            </button>
          </div>
        )}

        <p className="text-sm font-body font-semibold text-foreground mb-2">Добавить на экран смартфона</p>
        <p className="text-xs text-muted-foreground font-body mb-3">Открывается в браузере, требует интернет при первом запуске, а затем сможет работать и без него.</p>

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

        <p className="text-xs text-center text-muted-foreground font-body mt-4">Закладка будет называться <strong>«Справочник»</strong></p>
      </div>
    </div>
  );
}

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

  function handleLogoTap() {
    onNav("home");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    { id: "nearby",     label: "Быстрый ответ" },
    { id: "faq",        label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <ServiceStatusBanner />
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative flex items-center justify-between h-16 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center">
          <button onClick={handleLogoTap} className="flex items-center gap-2 justify-self-start relative">
            <div className="font-display text-base font-bold text-black leading-tight tracking-wide">
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
                onClick={() => onNav(item.id)}
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
              onClick={() => onNav(activeSection === "directory" ? "nearby" : "directory")}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-body font-medium"
            >
              <Icon name="Plus" size={15} />
              <span className="hidden sm:inline">2407.РФ</span>
            </button>
            <button className="md:hidden p-2 rounded-md hover:bg-muted" onClick={() => setMenuOpen(!menuOpen)}>
              <Icon name={menuOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>
      </div>

      {installOpen && <InstallModal onClose={() => setInstallOpen(false)} pwaPrompt={pwaPrompt} />}

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white">
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