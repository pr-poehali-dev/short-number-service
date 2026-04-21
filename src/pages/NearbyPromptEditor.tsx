import Icon from "@/components/ui/icon";

interface Props {
  prompt: string;
  promptLoading: boolean;
  promptSaved: boolean;
  onPromptChange: (val: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function NearbyPromptEditor({ prompt, promptLoading, promptSaved, onPromptChange, onSave, onClose }: Props) {
  return (
    <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
      <p className="text-sm font-body font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
        <Icon name="Search" size={14} /> Категории поиска (2GIS)
      </p>
      <textarea
        rows={3}
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="w-full px-3 py-2 border border-amber-300 rounded-xl font-body text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 bg-white resize-none"
        placeholder="кафе,ресторан,магазин,аптека,банк,супермаркет"
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={onSave}
          disabled={promptLoading || !prompt}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-body font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          <Icon name={promptSaved ? "Check" : "Save"} size={14} />
          {promptSaved ? "Сохранено!" : "Сохранить"}
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-amber-300 text-amber-700 rounded-xl text-sm font-body font-semibold hover:bg-amber-50 transition-colors"
        >
          <Icon name="X" size={14} />
          Отменить
        </button>
        <span className="text-xs text-amber-700 font-body">
          Перечислите категории через запятую, например: <code className="bg-amber-100 px-1 rounded">кафе,аптека,банкомат</code>
        </span>
      </div>
    </div>
  );
}
