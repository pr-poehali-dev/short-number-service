import Icon from "@/components/ui/icon";
import { INTERVAL_OPTIONS } from "./incidents.types";

function IntervalSelect({
  label,
  description,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  options: { value: number; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground font-body">{label}</p>
        <p className="text-xs text-muted-foreground font-body">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="text-sm font-body border border-border rounded-lg px-2 py-1.5 bg-white text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface MonitoringPollSettingsProps {
  intervalActive: number;
  intervalNew: number;
  saving: boolean;
  onChangeActive: (v: number) => void;
  onChangeNew: (v: number) => void;
  onSave: () => void;
}

export function MonitoringPollSettings({
  intervalActive,
  intervalNew,
  saving,
  onChangeActive,
  onChangeNew,
  onSave,
}: MonitoringPollSettingsProps) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <h3 className="font-body font-semibold text-foreground text-sm flex items-center gap-2">
          <Icon name="Timer" size={15} />
          Частота автообновления вкладки
        </h3>
      </div>
      <div className="px-4 divide-y divide-border">
        <IntervalSelect
          label="Когда мониторинг включён"
          description="Вкладка обновляет данные с этим интервалом, пока мониторинг активен"
          value={intervalActive}
          onChange={onChangeActive}
          options={INTERVAL_OPTIONS}
        />
        <IntervalSelect
          label="Когда мониторинг отключён"
          description="Вкладка обновляет кэшированные данные с этим интервалом"
          value={intervalNew}
          onChange={onChangeNew}
          options={INTERVAL_OPTIONS}
        />
      </div>
      <div className="px-4 py-3 border-t border-border flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-body font-medium disabled:opacity-50"
        >
          <Icon name={saving ? "Loader" : "Save"} size={14} className={saving ? "animate-spin" : ""} />
          Сохранить
        </button>
      </div>
    </div>
  );
}
