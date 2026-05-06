import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  mode: "subscribe" | "plans";
  cooldownHours?: number;
  onConfirmSubscribe: () => void;
  onClose: () => void;
}

const CHANNELS = [
  { name: "Telegram", icon: "Send", url: "https://t.me/qrnumber", color: "bg-[#229ED9] hover:bg-[#1a8bc4]" },
  { name: "ВКонтакте", icon: "Users", url: "https://vk.com/qrnumber", color: "bg-[#0077FF] hover:bg-[#005ecc]" },
];

export default function SubscribeModal({ mode, cooldownHours = 24, onConfirmSubscribe, onClose }: Props) {
  const [step, setStep] = useState<"main" | "confirm">("main");
  const [clicked, setClicked] = useState<string | null>(null);

  function handleChannelClick(name: string, url: string) {
    window.open(url, "_blank");
    setClicked(name);
    setStep("confirm");
  }

  if (mode === "plans") {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-5 pt-6 pb-4 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
              <Icon name="Sparkles" size={22} className="text-primary" />
            </div>
            <p className="font-display font-bold text-foreground text-lg">Лимит исчерпан</p>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Вы использовали все 2 генерации как подписчик
            </p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm font-body text-muted-foreground text-center">
              Вернитесь через <span className="font-semibold text-foreground">{cooldownHours} часов</span> — лимит обновится бесплатно
            </p>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-body text-muted-foreground text-center mb-2">или следите за нами, чтобы узнать о расширенных тарифах первыми</p>
              <div className="flex gap-2">
                {CHANNELS.map((ch) => (
                  <a
                    key={ch.name}
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-body font-semibold transition-colors ${ch.color}`}
                  >
                    <Icon name={ch.icon} size={15} />
                    {ch.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="px-5 pb-5">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-5 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-3">
            <Icon name="Star" size={22} className="text-primary" />
          </div>
          <p className="font-display font-bold text-foreground text-lg">Бесплатная генерация использована</p>
          <p className="text-sm font-body text-muted-foreground mt-1">
            Подписчики получают 2 генерации каждые 24 часа
          </p>
        </div>

        {step === "main" ? (
          <>
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-body text-muted-foreground text-center mb-3">Подпишитесь на один из каналов</p>
              {CHANNELS.map((ch) => (
                <button
                  key={ch.name}
                  onClick={() => handleChannelClick(ch.name, ch.url)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-body font-semibold transition-colors ${ch.color}`}
                >
                  <Icon name={ch.icon} size={16} />
                  Подписаться в {ch.name}
                </button>
              ))}
            </div>
            <div className="px-5 pb-5 border-t border-border pt-3">
              <p className="text-xs font-body text-muted-foreground text-center mb-2">
                Или вернитесь через <span className="font-semibold text-foreground">{cooldownHours} ч</span> — лимит обновится
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                Вернуться позже
              </button>
            </div>
          </>
        ) : (
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <Icon name="CheckCircle" size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-sm font-body text-green-800">
                Вы перешли в <span className="font-semibold">{clicked}</span>. Подписались?
              </p>
            </div>
            <button
              onClick={onConfirmSubscribe}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-body font-semibold hover:opacity-90 transition-opacity"
            >
              Да, я подписался — продолжить
            </button>
            <button
              onClick={() => setStep("main")}
              className="w-full py-2.5 rounded-xl border border-border text-sm font-body text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
