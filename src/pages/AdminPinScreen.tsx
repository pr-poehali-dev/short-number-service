import { useState } from "react";

const ADMIN_PIN = "2407";
const SESSION_KEY = "admin_auth_v1";

export function AdminPinScreen({ onAuth }: { onAuth: () => void }) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  function handleKey(k: string) {
    if (k === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (next === ADMIN_PIN) {
          sessionStorage.setItem(SESSION_KEY, "1");
          onAuth();
        } else {
          setPinError(true);
          setPin("");
          setTimeout(() => setPinError(false), 1500);
        }
      }, 100);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="font-display font-bold text-white text-xl">2407</span>
        </div>
        <h1 className="font-display font-bold text-xl text-foreground mb-1">Панель администратора</h1>
        <p className="text-sm text-muted-foreground font-body mb-6">Введите PIN-код для входа</p>
        <div className="flex gap-2 justify-center mb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-display font-bold transition-colors ${
                pinError
                  ? "border-red-400 bg-red-50 text-red-500"
                  : pin.length > i
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-muted text-transparent"
              }`}
            >
              {pin.length > i ? "•" : "·"}
            </div>
          ))}
        </div>
        {pinError && <p className="text-sm text-red-500 font-body mb-2">Неверный PIN</p>}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) => (
            <button
              key={k}
              disabled={!k}
              onClick={() => k && handleKey(k)}
              className={`h-12 rounded-xl font-display font-semibold text-lg transition-colors ${
                k
                  ? "bg-muted hover:bg-primary/10 text-foreground active:bg-primary/20"
                  : "invisible"
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
