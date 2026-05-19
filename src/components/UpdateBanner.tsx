import { useState, useEffect } from 'react';

export default function UpdateBanner() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingSW(reg.waiting);
        return;
      }
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(newSW);
          }
        });
      });
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) handleUpdate(reg);
    });
  }, []);

  const handleUpdate = () => {
    if (!waitingSW || updating) return;
    setUpdating(true);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waitingSW) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm whitespace-nowrap">
      <span>{updating ? 'Обновляем…' : 'Доступно обновление'}</span>
      <button
        onClick={handleUpdate}
        disabled={updating}
        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500 text-white px-3 py-1 rounded-lg font-medium transition-colors"
      >
        {updating && (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {updating ? 'Подождите' : 'Обновить'}
      </button>
    </div>
  );
}