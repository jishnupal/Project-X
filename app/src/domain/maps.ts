/** Free maps helpers — no API keys. Paste any map URL or build a search link. */

export function mapsSearchUrl(query: string): string {
  const q = String(query || "").trim();
  if (!q) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function normalizeMapsUrl(raw: unknown): string | undefined {
  const text = String(raw || "").trim();
  if (!text) return undefined;
  try {
    const withProtocol = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function resolveMapsUrl(mapsUrl: string | undefined, placeLabel?: string): string | undefined {
  return normalizeMapsUrl(mapsUrl) || mapsSearchUrl(placeLabel || "") || undefined;
}

export function openMapsUrl(url: string) {
  const clean = normalizeMapsUrl(url);
  if (!clean || typeof window === "undefined") return;
  window.open(clean, "_blank", "noopener,noreferrer");
}
