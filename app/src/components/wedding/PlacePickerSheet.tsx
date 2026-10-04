import { useEffect, useMemo, useRef, useState } from "react";
import { MobileSheet } from "../ui/MobileSheet";
import { Icon } from "../ui/Icon";
import { mapsSearchUrl, normalizeMapsUrl } from "../../domain/maps";
import { searchPlaces, type PickedPlace } from "../../domain/placeSearch";

type PlacePickerSheetProps = {
  open: boolean;
  initial?: { label?: string; mapsUrl?: string } | null;
  onClose: () => void;
  onDone: (place: PickedPlace) => void;
  onClear?: () => void;
  zIndexClass?: string;
};

function googleMapsEmbedUrl(place: PickedPlace): string {
  if (Number.isFinite(place.lat) && Number.isFinite(place.lon) && (place.lat || place.lon)) {
    return `https://maps.google.com/maps?q=${place.lat},${place.lon}&z=16&output=embed`;
  }
  const q = place.label.trim();
  if (!q) return "";
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

function labelFromMapsUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const placeMatch = parsed.pathname.match(/\/place\/([^/]+)/);
    if (placeMatch?.[1]) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim() || undefined;
    }
    const q = parsed.searchParams.get("q") || parsed.searchParams.get("query");
    if (q?.trim()) return q.trim();
  } catch {
    /* ignore */
  }
  return undefined;
}

function draftFromMapsLink(raw: string): PickedPlace | null {
  const asUrl = normalizeMapsUrl(raw);
  if (!asUrl || !/(google\.[^/]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(asUrl)) {
    return null;
  }
  return {
    label: labelFromMapsUrl(asUrl) || "Pinned place",
    detail: "From Google Maps link",
    mapsUrl: asUrl,
    lat: 0,
    lon: 0,
  };
}

export function PlacePickerSheet({
  open,
  initial,
  onClose,
  onDone,
  onClear,
  zIndexClass = "z-[90]",
}: PlacePickerSheetProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PickedPlace[]>([]);
  const [selected, setSelected] = useState<PickedPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const start = initial?.label || "";
    setQuery(start);
    setSuggestions([]);
    setError("");
    setLoading(false);
    setMapReady(false);
    setSelected(
      initial?.label && initial.mapsUrl
        ? {
            label: initial.label,
            detail: "Current place",
            mapsUrl: initial.mapsUrl,
            lat: 0,
            lon: 0,
          }
        : null,
    );
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [open, initial?.label, initial?.mapsUrl]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const linked = draftFromMapsLink(q);
    if (linked) {
      setSuggestions([]);
      setSelected(linked);
      setLoading(false);
      setError("");
      return;
    }

    if (q.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setError("");
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError("");
      try {
        const rows = await searchPlaces(q, controller.signal);
        if (controller.signal.aborted) return;
        setSuggestions(rows);
        if (!rows.length) {
          setError("No matches here — paste a Google Maps link, or use the typed name.");
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setSuggestions([]);
        setError("Search is slow — paste a Google Maps link, or use the typed name.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [open, query]);

  useEffect(() => {
    setMapReady(false);
  }, [selected?.lat, selected?.lon, selected?.label, selected?.mapsUrl]);

  const embedSrc = useMemo(() => {
    if (!selected) return "";
    if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(selected.mapsUrl || "")) return "";
    return googleMapsEmbedUrl(selected);
  }, [selected]);

  const showSuggestionPanel = query.trim().length >= 2 && !draftFromMapsLink(query) && !selected;

  return (
    <MobileSheet
      open={open}
      onClose={onClose}
      title="Find place"
      height="full"
      headerAction="back"
      zIndexClass={zIndexClass}
      panelClassName="bg-[#fff8f5]"
      bodyClassName="overflow-hidden"
    >
      <div className="flex h-full min-h-0 flex-col gap-3 px-4 pb-6 pt-2">
        <div className="relative shrink-0">
          <label className="block">
            <span className="text-[13px] font-medium text-[#584141]">Search or paste Maps link</span>
            <div className="relative mt-2">
              <Icon
                name="search"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[18px] text-[#584141]"
              />
              {loading ? (
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#584141]">
                  …
                </span>
              ) : null}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(null);
                }}
                placeholder="Place name, or paste Google Maps link"
                className="h-12 w-full rounded-full bg-white pl-11 pr-10 text-[16px] font-semibold outline-none placeholder:text-[#b5a9a4]"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </label>

          {showSuggestionPanel ? (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-10 overflow-hidden rounded-[22px] bg-white shadow-[0_16px_40px_rgba(30,27,24,0.16)]">
              {loading && suggestions.length === 0 ? (
                <div className="space-y-2 px-4 py-4">
                  <p className="text-[13px] font-semibold text-[#584141]">Finding suggestions…</p>
                  <div className="h-3 w-[80%] animate-pulse rounded-full bg-[#ece7e2]" />
                  <div className="h-3 w-[60%] animate-pulse rounded-full bg-[#ece7e2]" />
                </div>
              ) : (
                <ul className="max-h-[min(42vh,280px)] overflow-y-auto">
                  {suggestions.map((row) => (
                    <li
                      key={`${row.lat},${row.lon},${row.label}`}
                      className="border-t border-[#ece7e2] first:border-t-0"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row);
                          setQuery(row.label);
                          setSuggestions([]);
                          setError("");
                        }}
                        className="flex w-full items-start gap-3 px-3.5 py-3 text-left active:bg-[#fff8e8]"
                      >
                        <Icon name="location_on" className="mt-0.5 text-[20px] text-[#584141]" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-black">{row.label}</span>
                          {row.detail ? (
                            <span className="mt-0.5 block text-[12px] font-medium text-[#584141]">
                              {row.detail}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  ))}
                  <li className="border-t border-[#ece7e2]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected({
                          label: query.trim(),
                          detail: "Typed place name",
                          mapsUrl: mapsSearchUrl(query.trim()),
                          lat: 0,
                          lon: 0,
                        });
                        setSuggestions([]);
                      }}
                      className="flex w-full items-start gap-3 px-3.5 py-3 text-left active:bg-[#fff8e8]"
                    >
                      <Icon name="search" className="mt-0.5 text-[20px] text-[#584141]" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-black">
                          Use “{query.trim()}”
                        </span>
                        <span className="mt-0.5 block text-[12px] font-medium text-[#584141]">
                          {error || "Or paste a Google Maps link above"}
                        </span>
                      </span>
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="grid min-h-0 flex-1 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.9fr)]">
          <div className="relative min-h-[220px] overflow-hidden rounded-[22px] bg-[#fffdf8] md:min-h-0">
            {selected && embedSrc ? (
              <>
                {!mapReady ? (
                  <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-[#fffdf8] px-6 text-center">
                    <div className="h-8 w-8 animate-pulse rounded-full bg-[#ece7e2]" />
                    <p className="text-[14px] font-semibold text-[#584141]">Loading map…</p>
                    <p className="text-[12px] font-medium text-[#b5a9a4]">
                      Slow network? You can still Add this Place.
                    </p>
                  </div>
                ) : null}
                <iframe
                  key={embedSrc}
                  title="Map preview"
                  src={embedSrc}
                  className="h-full min-h-[220px] w-full border-0 md:min-h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  onLoad={() => setMapReady(true)}
                />
              </>
            ) : selected ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
                <Icon name="location_on" className="text-[36px] text-[#c4704a]" />
                <p className="text-[16px] font-extrabold text-black">{selected.label}</p>
                <p className="text-[13px] font-medium text-[#584141]">
                  Short Maps links can’t preview here — Add this Place still works.
                </p>
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 px-6 text-center">
                <Icon name="map" className="text-[36px] text-[#584141]" />
                <p className="text-[15px] font-semibold text-black">Map shows here</p>
                <p className="text-[13px] font-medium text-[#584141]">
                  Pick a suggestion — left map, right confirm.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-between rounded-[22px] bg-[#fffdf8] px-4 py-4">
            <div>
              <p className="text-[12px] font-bold tracking-[0.08em] text-[#584141]">PLACE</p>
              {selected ? (
                <>
                  <p className="mt-2 text-[20px] font-extrabold tracking-[-0.03em] text-black">
                    {selected.label}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#584141]">
                    {selected.detail || "Ready to tag"}
                  </p>
                  {selected.mapsUrl ? (
                    <a
                      href={selected.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[#584141]"
                    >
                      <Icon name="open_in_new" className="text-[16px]" />
                      Open in Maps
                    </a>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-2 text-[18px] font-extrabold tracking-[-0.03em] text-black">
                    Not selected yet
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#584141]">
                    Choose a suggestion, then Add this Place.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                disabled={!selected}
                onClick={() => {
                  if (!selected) return;
                  onDone(selected);
                  onClose();
                }}
                className="flex h-12 w-full items-center justify-center rounded-full bg-[#feca43] text-[15px] font-extrabold text-black disabled:opacity-40"
              >
                Add this Place
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-full items-center justify-center rounded-full bg-white text-[14px] font-semibold text-[#584141]"
              >
                Cancel
              </button>
              {initial?.label && onClear ? (
                <button
                  type="button"
                  onClick={() => {
                    onClear();
                    onClose();
                  }}
                  className="h-10 w-full text-[13px] font-semibold text-[#b5a9a4]"
                >
                  Remove place
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </MobileSheet>
  );
}
