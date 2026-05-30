import { useState } from "react";
import Icon from "@/components/ui/icon";

const VOTE_URL = "https://functions.poehali.dev/ab122f27-9496-402b-a89e-b78c74ddbe32";

interface Props {
  onClose: () => void;
  onApproved: () => void;
}

type Step = "vote" | "form" | "pending";

export default function NearbyVoteModal({ onClose, onApproved: _onApproved }: Props) {
  const [step, setStep] = useState<Step>("vote");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!phone.trim()) {
      setError("Укажите номер телефона — он нужен для открытия доступа");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch(VOTE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), comment: comment.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("pending");
        localStorage.setItem("nearby_voted", "1");
      }
    } catch {
      setError("Ошибка отправки. Попробуйте ещё раз.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          <Icon name="X" size={16} />
        </button>

        {step === "vote" && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Icon name="MapPin" size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-display font-bold text-foreground text-lg leading-tight">Раздел в разработке</h2>
                <p className="text-sm text-muted-foreground font-body">Проголосуйте, чтобы получить доступ</p>
              </div>
            </div>
            <p className="text-sm font-body text-muted-foreground leading-relaxed mb-5">Что, если каждый раз, открывая один сайт, вы получали бы быстрый ответ на вопрос «куда зайти сегодня»? Не рекламу. Не общие советы. Ответ для вас.
Сайт называется «Быстрый ответ». Вы сохраняете места, которые любите или хотите посетить, — нейросеть берёт на себя остальное.
А теперь — самое интересное. Владельцы этих мест видят, что вы их сохранили и начинают работать с аудиторией: запускают акции, присылают спецпредложения, сообщают о новинках. Вы уже в их поле зрения — ещё до первого визита.
Сервис будет использовать коммерческий API 2ГИС, поэтому доступ к нему откроется, когда наберём 1000 голосов.</p>
            <button
              onClick={() => setStep("form")}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-body font-semibold transition-colors"
            >
              <Icon name="ThumbsUp" size={16} />
              Голосую «За»
            </button>
            <button onClick={onClose} className="w-full mt-2 py-2 text-sm text-muted-foreground font-body hover:text-foreground transition-colors">
              Позже
            </button>
          </div>
        )}

        {step === "form" && (
          <div className="p-6">
            <h2 className="font-display font-bold text-foreground text-lg mb-1">Оставьте контакт</h2>
            <p className="text-sm text-muted-foreground font-body mb-4">
              Номер нужен, чтобы мы могли открыть вам доступ. Ваши данные не передаются третьим лицам.
            </p>

            <label className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setError(""); }}
              placeholder="+7 (___) ___-__-__"
              className="w-full border border-border rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:border-primary mb-3 bg-white"
            />

            <label className="block text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Комментарий <span className="text-muted-foreground font-normal">(необязательно)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Что было бы особенно полезно в этом разделе?"
              rows={3}
              className="w-full border border-border rounded-xl px-3 py-2.5 font-body text-sm focus:outline-none focus:border-primary resize-none mb-1 bg-white"
            />

            {error && (
              <p className="text-xs text-red-500 font-body mb-3 flex items-center gap-1">
                <Icon name="AlertCircle" size={12} /> {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl font-body font-semibold transition-colors mt-3"
            >
              {sending
                ? <><Icon name="Loader" size={15} className="animate-spin" /> Отправляю...</>
                : <><Icon name="Send" size={15} /> Отправить голос</>
              }
            </button>
          </div>
        )}

        {step === "pending" && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={28} className="text-green-600" />
            </div>
            <h2 className="font-display font-bold text-foreground text-lg mb-2">Голос принят!</h2>
            <p className="text-sm font-body text-muted-foreground leading-relaxed mb-5">
              Спасибо! Мы сообщим вам, как только откроем доступ к разделу. Следите за обновлениями.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-5 bg-primary text-primary-foreground rounded-xl font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              Понятно
            </button>
          </div>
        )}
      </div>
    </div>
  );
}