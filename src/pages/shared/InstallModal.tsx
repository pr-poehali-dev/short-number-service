import Icon from "@/components/ui/icon";

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallModal({ onClose, pwaPrompt }: { onClose: () => void; pwaPrompt?: BeforeInstallPromptEvent | null }) {
  const handlePwaInstall = async () => {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    await pwaPrompt.userChoice;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border-2 border-primary/20 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden bg-card">
              <img src="https://cdn.poehali.dev/files/7bcf9c89-8cb9-48db-a7ac-f8b6902960bd.png" alt="2407" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-lg leading-tight">Справочник</h3>
              <p className="text-xs text-muted-foreground font-body">Работает, как приложение.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <Icon name="X" size={18} className="text-muted-foreground" />
          </button>
        </div>

        {pwaPrompt && (
          <div className="mb-4 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm font-body font-semibold text-foreground mb-1 flex items-center gap-2">
              <Icon name="Download" size={15} className="text-primary" /> Установить как приложение
            </p>
            <p className="text-xs text-muted-foreground font-body mb-3">Работает без интернета, открывается без браузера — как обычное приложение.</p>
            <button
              onClick={handlePwaInstall}
              className="w-full bg-primary text-white rounded-lg py-2 text-sm font-body font-semibold hover:bg-primary/90 transition-colors"
            >
              Установить приложение
            </button>
          </div>
        )}

        <p className="text-sm font-body font-semibold text-foreground mb-2">Добавить на экран смартфона</p>
        <p className="text-xs text-muted-foreground font-body mb-3">Открывается в браузере, требует интернет при первом запуске, а затем сможет работать и без него.</p>

        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
            <p className="text-sm font-body font-semibold text-blue-800 mb-1.5 flex items-center gap-1.5">
              <Icon name="Apple" size={14} /> iOS (Safari)
            </p>
            <ol className="text-sm text-blue-700 font-body space-y-1 list-decimal list-inside">
              <li>Нажмите кнопку «Поделиться» внизу экрана</li>
              <li>Выберите «На экран "Домой"»</li>
              <li>Нажмите «Добавить»</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
            <p className="text-sm font-body font-semibold text-green-800 mb-1.5 flex items-center gap-1.5">
              <Icon name="Smartphone" size={14} /> Android (Chrome)
            </p>
            <ol className="text-sm text-green-700 font-body space-y-1 list-decimal list-inside">
              <li>Нажмите меню <strong>⋮</strong> в правом верхнем углу</li>
              <li>Выберите «Добавить на главный экран»</li>
              <li>Подтвердите добавление</li>
            </ol>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground font-body mt-4">Закладка будет называться <strong>«Справочник»</strong></p>
      </div>
    </div>
  );
}
