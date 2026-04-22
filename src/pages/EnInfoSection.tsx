import { useState } from "react";
import Icon from "@/components/ui/icon";
import { FAQ_ITEMS_EN, PROCEDURES_EN } from "./data-en";

export function EnInfoSection() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <>
      <section id="faq" className="max-w-6xl mx-auto px-4 py-8 border-t border-border mt-4">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_ITEMS_EN.map((item, i) => (
            <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
              >
                <span className="font-display font-semibold text-foreground">{item.q}</span>
                <Icon
                  name={faqOpen === i ? "ChevronUp" : "ChevronDown"}
                  size={18}
                  className="text-muted-foreground flex-shrink-0"
                />
              </button>
              {faqOpen === i && (
                <div className="px-5 pb-4">
                  <p className="text-muted-foreground font-body leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 border-t border-border">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">How to Get a Short Number</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PROCEDURES_EN.map((proc, i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon name={proc.icon as Parameters<typeof Icon>[0]["name"]} size={20} className="text-primary" />
              </div>
              <h3 className="font-display font-bold text-foreground mb-3">{proc.title}</h3>
              <ol className="space-y-2 mb-4">
                {proc.steps.map((step, j) => (
                  <li key={j} className="flex gap-2 text-sm font-body text-muted-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="flex gap-3 text-xs font-body">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icon name="Clock" size={12} /> {proc.time}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icon name="Wallet" size={12} /> {proc.cost}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}