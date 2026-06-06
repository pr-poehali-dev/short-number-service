const BUILD_INFO_URL = "https://functions.poehali.dev/233bf647-2fcb-4d05-87c2-104561f450dc";

let cachedVersion: string | null = null;

export async function fetchBuildTime(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  try {
    const res = await fetch(BUILD_INFO_URL);
    const data = await res.json();
    cachedVersion = data.build_time ?? "—";
  } catch {
    cachedVersion = "—";
  }
  return cachedVersion!;
}
