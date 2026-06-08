const BUILD_INFO_URL = "https://functions.poehali.dev/233bf647-2fcb-4d05-87c2-104561f450dc";

export async function fetchBuildTime(): Promise<string> {
  try {
    const res = await fetch(BUILD_INFO_URL + "?t=" + Date.now());
    const data = await res.json();
    return data.build_time ?? "—";
  } catch {
    return "—";
  }
}