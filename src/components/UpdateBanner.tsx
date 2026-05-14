import { useState, useEffect } from 'react';

export default function UpdateBanner() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);

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
    if (!waitingSW) return;
    waitingSW.postMessage({ type: 'SKIP_WAITING' });
    waitingSW.addEventListener('statechange', () => {
      if (waitingSW.state === 'activated') {
        window.location.reload();
      }
    });
  };

  if (!waitingSW) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
      <span>Доступно обновление</span>
      <button
        onClick={handleUpdate}
        className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-1 rounded-lg font-medium transition-colors"
      >
        Обновить
      </button>
    </div>
  );
}
