import { useState } from "react";
import Icon from "@/components/ui/icon";
import { FAQ_ITEMS, PROCEDURES } from "./data";

type IconName = Parameters<typeof Icon>[0]["name"];

export function ProceduresSection() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Процедуры получения номеров</h2>
      <p className="text-muted-foreground font-body mb-8">Пошаговые инструкции для юридических и физических лиц</p>

      <div className="space-y-5">
        {PROCEDURES.map((proc, i) => (
          <div key={i} className="bg-white border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={proc.icon as IconName} size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-foreground">{proc.title}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                    <Icon name="Clock" size={13} /> {proc.time}
                  </span>
                  <span className="text-sm text-muted-foreground font-body flex items-center gap-1">
                    <Icon name="CreditCard" size={13} /> {proc.cost}
                  </span>
                </div>
              </div>
            </div>
            <ol className="space-y-2.5">
              {proc.steps.map((step, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-xs font-display font-bold flex items-center justify-center mt-0.5">
                    {j + 1}
                  </span>
                  <span className="text-sm text-foreground font-body leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Icon name="AlertCircle" size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 font-body">
          Процедуры могут меняться. Перед подачей документов уточняйте актуальные требования на официальных сайтах операторов и Роскомнадзора.
        </p>
      </div>
    </div>
  );
}

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Часто задаваемые вопросы</h2>
      <p className="text-muted-foreground font-body mb-8">Ответы на популярные вопросы о коротких номерах</p>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
            >
              <span className="font-body font-semibold text-foreground pr-4">{item.q}</span>
              <Icon name={open === i ? "ChevronUp" : "ChevronDown"} size={18} className="text-muted-foreground flex-shrink-0" />
            </button>
            {open === i && (
              <div className="px-5 pb-4">
                <p className="text-foreground font-body leading-relaxed text-sm">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactsSection() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      <h2 className="font-display text-3xl font-bold text-foreground mb-1">Контакты</h2>
      <p className="text-muted-foreground font-body mb-8">Свяжитесь с нами, чтобы предложить номер или сообщить об ошибке</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { icon: "Send",  title: "Telegram-канал", desc: "Новости и обновления базы", color: "bg-[#2AABEE]", link: "https://t.me/qrnumber" },
          { icon: "Users", title: "ВКонтакте",      desc: "Сообщество и поддержка",   color: "bg-[#0077FF]", link: "https://vk.com/qrnumber" },
        ].map((c) => (
          <a key={c.title} href={c.link} target="_blank" rel="noopener noreferrer"
            className="hover-scale bg-white border border-border rounded-xl p-5 flex items-center gap-4 no-underline"
          >
            <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center flex-shrink-0`}>
              <Icon name={c.icon as IconName} size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">{c.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{c.desc}</p>
            </div>
          </a>
        ))}
      </div>

    </div>
  );
}
