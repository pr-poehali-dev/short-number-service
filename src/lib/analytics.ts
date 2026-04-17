declare global {
  interface Window {
    ym?: (id: number, action: string, goal: string, params?: Record<string, unknown>) => void;
  }
}

const YM_ID = 101026698;

export function ymGoal(goal: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.ym) {
    window.ym(YM_ID, "reachGoal", goal, params);
  }
}