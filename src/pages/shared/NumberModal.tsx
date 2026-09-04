import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber } from "../data";
import { ymGoal } from "@/lib/analytics";
import { isShortNumber } from "./NumberCard";

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
        className="bg-card rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in"
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
                disabled={isFavorite}
                className="p-2 rounded-lg hover:bg-yellow-50 disabled:opacity-40 disabled:cursor-default transition-colors"
                title={isFavorite ? "Уже в избранном" : maxReached ? "Добавить в избранное (заменит самое старое, макс. 6)" : "Добавить в избранное"}
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
          {num.regions && num.regions.length > 0 && (
            <div className="flex items-start gap-1.5">
              <Icon name="MapPin" size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 font-body leading-snug">
                Доступен в регионах: <span className="font-semibold">{num.regions.join(", ")}</span>
              </p>
            </div>
          )}
          {num.procedure && (
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-sm font-body font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Icon name="Info" size={14} /> Как воспользоваться
              </p>
              <p className="text-sm text-blue-800 font-body">{num.procedure}</p>
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
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-card border-2 border-primary text-primary rounded-xl font-body font-semibold hover:bg-primary/5 transition-colors"
          >
            <Icon name="UserPlus" size={18} />
            <span className="hidden sm:inline">Сохранить</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-12 h-12 my-auto bg-card text-muted-foreground rounded-xl hover:text-primary transition-colors flex-shrink-0"
            title={copied ? "Скопировано!" : "Поделиться"}
          >
            <Icon name={copied ? "Check" : "Share2"} size={18} className={copied ? "text-green-500" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}
