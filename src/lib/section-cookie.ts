import { createIsomorphicFn } from "@tanstack/react-start";

const DEFAULT_SECTION_COOKIE = "default_section";

// Reads the "default_section" cookie both during server render and in the browser,
// so the home page renders the saved section on the server without a hydration mismatch.
export const readDefaultSection = createIsomorphicFn()
  .server(async (): Promise<string | null> => {
    const { getCookie } = await import("@tanstack/react-start/server");
    return getCookie(DEFAULT_SECTION_COOKIE) ?? null;
  })
  .client(async (): Promise<string | null> => {
    const match = document.cookie.match(new RegExp("(?:^|; )" + DEFAULT_SECTION_COOKIE + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : null;
  });
