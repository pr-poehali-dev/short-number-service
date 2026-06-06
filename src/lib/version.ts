const buildTime = import.meta.env.VITE_BUILD_TIME;

function formatNow() {
  return new Date().toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export const APP_VERSION = buildTime ?? formatNow();