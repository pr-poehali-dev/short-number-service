import Icon from "@/components/ui/icon";
import { PhoneNumber, Operator, OPERATOR_COLORS } from "../data";
import { ymGoal } from "@/lib/analytics";

export function OperatorBadge({ operator }: { operator: Operator }) {
  if (operator === "Универсальный") return null;
  const c = OPERATOR_COLORS[operator];
  return (
    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-body font-medium border ${c.bg} ${c.text} ${c.border}`}>
      {operator}
    </span>
  );
}

export const isShortNumber = (n: string) => n.replace(/\D/g, "").length <= 4;

export function NumberCard({ num, onClick }: { num: PhoneNumber; onClick: (n: PhoneNumber) => void }) {
  const short = isShortNumber(num.number);
  return (
    <button
      onClick={() => { onClick(num); ymGoal("card_open", { number: num.number, name: num.name, category: num.category, operator: num.operator }); }}
      className="number-card w-full text-left bg-card border border-border rounded-xl p-4 flex items-start gap-3 cursor-pointer"
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
          <div className="flex-shrink-0 flex items-center gap-1">
            {num.industry && (
              <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium border bg-amber-50 text-amber-700 border-amber-200">
                {num.industry}
              </span>
            )}
            {num.category === "Коммерческие" && num.deviceAccess !== "any" && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 font-body">
                <Icon name="Smartphone" size={11} /> <span className="hidden sm:inline">Смартфон</span>
              </span>
            )}
            {(num.operator === "МТС" || num.operator === "Билайн" || num.operator === "МегаФон" || num.operator === "Т2") && (() => {
              const c = OPERATOR_COLORS[num.operator];
              return (
                <span className={`inline-flex items-center gap-1 text-xs ${c.text} ${c.bg} ${c.border} border rounded-full px-2 py-0.5 font-body`}>
                  <Icon name="Signal" size={11} /> Только с {num.operator}
                </span>
              );
            })()}
          </div>
        </div>
        {!short && (
          <p className="font-display font-bold text-primary text-sm mb-1 tracking-wide">{num.number}</p>
        )}
        <p className="text-sm text-muted-foreground font-body line-clamp-2">{num.description}</p>
        {num.regions && num.regions.length > 0 && (
          <p className="text-xs text-amber-600 font-body mt-1 truncate flex items-center gap-1">
            <Icon name="MapPin" size={11} className="flex-shrink-0" />
            {num.regions.slice(0, 2).join(", ")}{num.regions.length > 2 ? "…" : ""}
          </p>
        )}
      </div>
    </button>
  );
}
