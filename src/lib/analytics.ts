declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string, params?: Record<string, unknown>) => void;
  }
}

const YM_IDS = [101026698, 103323875];

export function ymGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.ym) {
    YM_IDS.forEach((id) => window.ym!(id, "reachGoal", goal, params));
  }
}