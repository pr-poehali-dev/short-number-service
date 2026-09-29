import { useEffect } from "react";

const PWA_INSTALLS_URL = "https://functions.poehali.dev/57074bf1-c5f2-4712-b344-405222f47416";
const INSTALLED_FLAG_KEY = "pwa_install_recorded";

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "android";
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  return "desktop";
}

export default function PwaInstallTracker() {
  useEffect(() => {
    const handleInstalled = () => {
      if (localStorage.getItem(INSTALLED_FLAG_KEY)) return;
      localStorage.setItem(INSTALLED_FLAG_KEY, "1");
      fetch(PWA_INSTALLS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: detectPlatform() }),
      }).catch(() => {});
    };
    window.addEventListener("appinstalled", handleInstalled);
    return () => window.removeEventListener("appinstalled", handleInstalled);
  }, []);

  return null;
}
