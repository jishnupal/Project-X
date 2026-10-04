/** Free place search via Photon (OpenStreetMap) — no API key. */

export type PickedPlace = {
  label: string;
  detail?: string;
  mapsUrl: string;
  lat: number;
  lon: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

function joinParts(parts: Array<string | undefined>): string {
  return parts
    .map((p) => String(p || "").trim())
    .filter(Boolean)
    .join(", ");
}

export function mapsUrlForCoords(lat: number, lon: number, label?: string): string {
  const q = label?.trim() ? `${label.trim()}@${lat},${lon}` : `${lat},${lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PickedPlace[]> {
  const q = String(query || "").trim();
  if (q.length < 2) return [];

  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Place search failed");
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];

  return features
    .map((feature): PickedPlace | null => {
      const [rawLon, rawLat] = feature.geometry?.coordinates || [];
      if (typeof rawLat !== "number" || typeof rawLon !== "number") return null;
      if (!Number.isFinite(rawLat) || !Number.isFinite(rawLon)) return null;
      const lat = rawLat;
      const lon = rawLon;
      const p = feature.properties || {};
      const locality = p.city || p.town || p.village;
      const street = joinParts([p.housenumber, p.street]);
      const label =
        p.name?.trim() ||
        street ||
        locality ||
        joinParts([p.state, p.country]) ||
        `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      const detail = joinParts([
        p.name && street ? street : undefined,
        locality,
        p.state,
        p.country,
      ]);
      return {
        label,
        detail: detail && detail !== label ? detail : undefined,
        lat,
        lon,
        mapsUrl: mapsUrlForCoords(lat, lon, label),
      };
    })
    .filter((row): row is PickedPlace => Boolean(row));
}
