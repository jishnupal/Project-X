import { startTransition, useCallback, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useSearchParams,
  type Location,
  type NavigateFunction,
} from "react-router-dom";
import { useAccess } from "../hooks/useAccess";

export const EVENT_HOME_HOST = "/command-center";
export const SHEET_QUERY = "sheet";

type Target = { pathname: string; search: string };

function parseTarget(to: string): Target {
  if (to.startsWith("?")) {
    return { pathname: "", search: to };
  }
  const q = to.indexOf("?");
  if (q === -1) return { pathname: to, search: "" };
  return { pathname: to.slice(0, q), search: to.slice(q) };
}

function sheetOf(search: string): string | null {
  const value = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get(SHEET_QUERY);
  return value && value.trim() ? value.trim() : null;
}

function sameTarget(location: Location, target: Target): boolean {
  const path = target.pathname || location.pathname;
  const search = target.search || "";
  const currentSearch = location.search || "";
  return location.pathname === path && currentSearch === search;
}

/** Role landing route that sits under the event list in history. */
export function eventHomeFor(role: { isGuest: boolean; isBuddy: boolean }): string {
  if (role.isGuest) return "/buzz";
  if (role.isBuddy) return "/buddies";
  return EVENT_HOME_HOST;
}

/**
 * In-event navigation: keep stack as dashboard → home → [at most one thing].
 * Pure client history — never fetches.
 */
export function navigateInsideEvent(
  navigate: NavigateFunction,
  location: Location,
  to: string,
  home: string,
): void {
  const parsed = parseTarget(to);
  const pathname = parsed.pathname || location.pathname || home;
  const search = parsed.search || "";
  const target: Target = { pathname, search };

  if (sameTarget(location, target)) return;

  const targetSheet = sheetOf(search);
  const currentSheet = sheetOf(location.search);
  const targetIsBareHome = pathname === home && !targetSheet;
  const currentIsBareHome = location.pathname === home && !currentSheet;

  const state = targetSheet ? { eventSheet: targetSheet } : undefined;

  if (targetIsBareHome) {
    navigate({ pathname: home, search: "" }, { replace: true });
    return;
  }

  if (currentIsBareHome) {
    navigate({ pathname, search }, { replace: false, state });
    return;
  }

  navigate({ pathname, search }, { replace: true, state });
}

export function useEventHome(): string {
  const { isGuest, isBuddy } = useAccess();
  return useMemo(() => eventHomeFor({ isGuest, isBuddy }), [isGuest, isBuddy]);
}

export function useNavigateInsideEvent(): (to: string) => void {
  const navigate = useNavigate();
  const location = useLocation();
  const home = useEventHome();

  return useCallback(
    (to: string) => {
      startTransition(() => {
        navigateInsideEvent(navigate, location, to, home);
      });
    },
    [navigate, location, home],
  );
}

/**
 * Sync a full-screen sheet with `?sheet=<id>` on the event home path.
 * Open/close is history-only (no API).
 */
export function useSheetHistory(sheetId: string): [boolean, (open: boolean) => void] {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const home = useEventHome();
  const go = useNavigateInsideEvent();
  const open = searchParams.get(SHEET_QUERY) === sheetId;

  const setOpen = useCallback(
    (next: boolean) => {
      const current = searchParams.get(SHEET_QUERY);
      if (next) {
        if (current === sheetId) return;
        const path =
          location.pathname === home || location.pathname === EVENT_HOME_HOST
            ? location.pathname
            : home;
        go(`${path}?${SHEET_QUERY}=${encodeURIComponent(sheetId)}`);
        return;
      }
      if (current !== sheetId) return;
      // Pop when we pushed/replaced this sheet ourselves; otherwise clear in place
      // (deeplink like ?sheet=invites landed as the Home history entry).
      const owned =
        Boolean(location.state) &&
        typeof location.state === "object" &&
        (location.state as { eventSheet?: string }).eventSheet === sheetId;
      if (owned) navigate(-1);
      else navigate({ pathname: home, search: "" }, { replace: true });
    },
    [searchParams, sheetId, location.pathname, location.state, home, go, navigate],
  );

  return [open, setOpen];
}
