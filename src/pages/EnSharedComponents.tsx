import { useState } from "react";
import Icon from "@/components/ui/icon";
import { PhoneNumber, OPERATOR_COLORS } from "./data";
import { OPERATOR_MAP_EN, CATEGORY_MAP_EN } from "./data-en";

export const isShortNumber = (n: string) => n.replace(/\D/g, "").length <= 4;

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

function generateVCard(num: PhoneNumber, name: string, description: string): string {
  const photo = generateContactPhoto(num.number);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${name}`,
    `N:${name};;;;`,
    `TEL;TYPE=CELL:${num.number}`,
    `ORG:${num.organization ?? "Directory 2407.rf"}`,
    `CATEGORIES:${num.category}`,
    `NOTE:${description.replace(/\n/g, "\\n")} | Operator: ${num.operator}`,
    "URL:2407.rf",
    `PHOTO;ENCODING=b;TYPE=JPEG:${photo}`,
    "END:VCARD",
  ];
  return lines.join("\r\n");
}

function saveVCard(num: PhoneNumber, name: string, description: string) {
  const vcardStr = generateVCard(num, name, description);
  const blob = new Blob([vcardStr], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${num.number}_${name.replace(/[^a-zA-Z0-9]/g, "_")}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function OperatorBadgeEn({ operator }: { operator: string }) {
  if (operator === "Универсальный") return null;
  const c = OPERATOR_COLORS[operator as keyof typeof OPERATOR_COLORS] ?? {
    bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200",
  };
  return (
    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {OPERATOR_MAP_EN[operator] ?? operator}
    </span>
  );
}

export function NumberCardEn({ num, enNum, onClick }: {
  num: PhoneNumber;
  enNum: { name: string; description: string } | undefined;
  onClick: (n: PhoneNumber, enN: typeof enNum) => void;
}) {
  const short = isShortNumber(num.number);
  const name = enNum?.name ?? num.name;
  const desc = enNum?.description ?? num.description;
  return (
    <button
      onClick={() => onClick(num, enNum)}
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
          <h3 className="font-display font-semibold text-foreground text-base leading-tight truncate">{name}</h3>
          <div className="flex-shrink-0 flex items-center gap-1">
            {num.category === "Коммерческие" && num.deviceAccess !== "any" && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5 font-body">
                <Icon name="Smartphone" size={11} /> Smartphone only
              </span>
            )}
            {(num.operator === "МТС" || num.operator === "Билайн" || num.operator === "МегаФон" || num.operator === "Т2") && (() => {
              const c = OPERATOR_COLORS[num.operator];
              return (
                <span className={`inline-flex items-center gap-1 text-xs ${c.text} ${c.bg} ${c.border} border rounded-full px-2 py-0.5 font-body`}>
                  <Icon name="Signal" size={11} /> {OPERATOR_MAP_EN[num.operator] ?? num.operator} only
                </span>
              );
            })()}
          </div>
        </div>
        {!short && (
          <p className="font-display font-bold text-primary text-sm mb-1 tracking-wide">{num.number}</p>
        )}
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{desc}</p>
      </div>
    </button>
  );
}

export function NumberModalEn({
  num, enNum, onClose, onAddFavorite, isFavorite, maxReached,
}: {
  num: PhoneNumber;
  enNum: { name: string; description: string; procedure?: string } | undefined;
  onClose: () => void;
  onAddFavorite?: () => void;
  isFavorite?: boolean;
  maxReached?: boolean;
}) {
  const short = isShortNumber(num.number);
  const name = enNum?.name ?? num.name;
  const desc = enNum?.description ?? num.description;
  const procedure = enNum?.procedure ?? num.procedure;
  const category = CATEGORY_MAP_EN[num.category] ?? num.category;
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `${name} — ${num.number}\n${desc}\n\n📞 Directory «2407.rf»`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
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
              <h2 className="font-display text-xl font-bold text-foreground mb-0.5">{name}</h2>
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
                title={isFavorite ? "Already in favorites" : maxReached ? "Favorites full (max 6)" : "Add to favorites"}
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
            <p className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
            <p className="text-foreground font-body leading-relaxed">{desc}</p>
          </div>
          {procedure && (
            <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
              <p className="text-sm font-body font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                <Icon name="Info" size={14} /> How to use
              </p>
              <p className="text-sm text-blue-800 font-body">{procedure}</p>
            </div>
          )}
          {num.category === "Коммерческие" && (
            <div className="flex items-center gap-2 flex-wrap">
              {num.deviceAccess === "any" ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 font-body">
                  <Icon name="CheckCircle" size={13} /> Works on smartphones and regular phones
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 font-body">
                  <Icon name="Smartphone" size={13} /> Smartphones only (star number)
                </span>
              )}
            </div>
          )}
          {(num.operator === "МТС" || num.operator === "Билайн" || num.operator === "МегаФон" || num.operator === "Т2") && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 font-body">
                <Icon name="Signal" size={13} /> {OPERATOR_MAP_EN[num.operator] ?? num.operator} network only
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 font-body">
                <Icon name="Smartphone" size={13} /> Smartphone only
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-body text-muted-foreground">Category:</span>
            <span className="text-sm font-body font-semibold text-foreground">{category}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border flex gap-2">
          <a
            href={`tel:${num.number}`}
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-primary text-white rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            <Icon name="Phone" size={18} />
            <span className="hidden sm:inline">Call</span>
          </a>
          <button
            onClick={() => saveVCard(num, name, desc)}
            className="flex items-center justify-center gap-2 flex-1 py-3 bg-white border-2 border-primary text-primary rounded-xl font-body font-semibold hover:bg-primary/5 transition-colors"
          >
            <Icon name="UserPlus" size={18} />
            <span className="hidden sm:inline">Save contact</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-12 h-12 my-auto bg-white text-muted-foreground rounded-xl hover:text-primary transition-colors flex-shrink-0"
            title={copied ? "Copied!" : "Share"}
          >
            <Icon name={copied ? "Check" : "Share2"} size={18} className={copied ? "text-green-500" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
}