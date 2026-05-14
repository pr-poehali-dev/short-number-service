import * as React from 'react';
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const sw = reg.installing || reg.waiting || reg.active;
      if (sw) {
        const assets = performance.getEntriesByType('resource')
          .map((e) => new URL((e as PerformanceResourceTiming).name).pathname)
          .filter((p) => p.endsWith('.js') || p.endsWith('.css'));
        sw.postMessage({ type: 'PRECACHE_ASSETS', assets });
      }
    }).catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(<App />);