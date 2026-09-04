import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onClose: () => void;
  onApproved: () => void;
}

export default function NearbyVoteModal({ onClose }: Props) {
  const [step, setStep] = useState<"vote" | "pending">("vote");

  function handleVote() {
    setStep("pending");
  }

  function handleSendMail() {
    const subject = encodeURIComponent('Голосую "ЗА" интернет-сервис "Быстрый ответ"');
    window.location.href = `mailto:vote@incode.ru?subject=${subject}`;
    localStorage.setItem("nearby_voted", "1");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md relative">
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
            <p className="text-sm font-body text-muted-foreground leading-relaxed mb-5">Что, если каждый раз, открывая сайт "быстрый-ответ.рф", вы получали бы ответ на вопрос «куда зайти сегодня»? Не рекламу и не общие советы, а сразу ответ — для вас. Нужно лишь сохранять в "Избранное" места, которые вы любите или хотите посетить, а нейрогид возьмёт на себя остальное. Теперь — самое интересное. Владельцы этих мест будут видеть, что их сохранили, и начнут работать с вами, как с ценной аудиторией: запускать акции, присылать спецпредложения, сообщать о новинках. Интересно?</p>
            <button
              onClick={handleVote}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-body font-semibold transition-colors"
            >
              <Icon name="ThumbsUp" size={16} />
              Голосую «За»
            </button>
          </div>
        )}

        {step === "pending" && (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Icon name="Mail" size={28} className="text-green-600" />
            </div>
            <h2 className="font-display font-bold text-foreground text-lg mb-2">Почти готово!</h2>
            <p className="text-sm font-body text-muted-foreground leading-relaxed mb-5">
              Откроется ваш почтовый клиент с готовым письмом. Просто отправьте его — и голос будет засчитан.
            </p>
            <button
              onClick={handleSendMail}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-body font-semibold transition-colors"
            >
              <Icon name="Mail" size={16} />
              Готово — открыть почту
            </button>
          </div>
        )}
      </div>
    </div>
  );
}