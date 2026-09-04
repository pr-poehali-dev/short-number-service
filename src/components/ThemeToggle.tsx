import Icon from "@/components/ui/icon";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
      className={`flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`}
    >
      <Icon name={theme === "dark" ? "Sun" : "Moon"} size={16} />
    </button>
  );
}
