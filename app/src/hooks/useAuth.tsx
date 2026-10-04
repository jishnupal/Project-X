import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearEventListHold } from "../domain/access/eventListHold";
import { rememberHostFace } from "../domain/access/hostFaces";
import { clearAccessSession } from "../domain/access/sessionLocal";

// ─── Types ─────────────────────────────────────────────────
export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  platformRole: "customer" | "platform_admin";
  hasPasscode: boolean;
  buzzPoints?: number;
  provisional?: boolean;
};

export type EventMembership = {
  id: string;
  eventId: string;
  eventCode: string;
  eventName: string;
  eventType: string;
  role: "admin" | "buddy" | "guest";
  moduleGrants: Record<string, string>;
  status: string;
  empty?: boolean;
  owner?: boolean;
};

export type RemovedEvent = EventMembership & {
  deletedAt: number;
  restoreUntil: number;
};

export type AuthState = {
  /** null = not checked yet, "anon" = checked & not logged in */
  status: "loading" | "anon" | "authenticated";
  user: AuthUser | null;
  memberships: EventMembership[];
  removed: RemovedEvent[];
};

type AuthContextValue = AuthState & {
  /** Redirect to Google OAuth (production) */
  loginWithGoogle: (returnTo?: string, hint?: string, auto?: boolean, pick?: boolean) => void;
  /** Dev-only email login */
  devLogin: (email: string, name?: string) => Promise<void>;
  /** Kill session */
  logout: () => Promise<void>;
  /** Re-fetch /api/auth/me */
  refreshAuth: () => Promise<void>;
  /** Create a new event */
  createEvent: (name: string, eventType?: string) => Promise<{ id: string; code: string }>;
  deleteEvent: (eventId: string) => Promise<void>;
  restoreEvent: (eventId: string) => Promise<void>;
  renameEvent: (eventId: string, name: string) => Promise<void>;
  /** Link a legacy event code to this Google account */
  linkLegacyEvent: (code: string, role?: string) => Promise<void>;
  /** First-time admin lock after Google sign-in */
  setPasscode: (passcode: string) => Promise<void>;
  /** Check the admin passcode */
  verifyPasscode: (passcode: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    memberships: [],
    removed: [],
  });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (!res.ok) {
        setState({ status: "anon", user: null, memberships: [], removed: [] });
        return;
      }
      const data = await res.json();
      if (data.user) {
        rememberHostFace({
          email: data.user.email,
          name: data.user.name,
          avatarUrl: data.user.avatarUrl ?? null,
        });
        setState({
          status: "authenticated",
          user: { ...data.user, hasPasscode: Boolean(data.user.hasPasscode) },
          memberships: data.memberships || [],
          removed: data.removed || [],
        });
      } else {
        setState({ status: "anon", user: null, memberships: [], removed: [] });
      }
    } catch {
      setState({ status: "anon", user: null, memberships: [], removed: [] });
    }
  }, []);

  useEffect(() => {
    void fetchMe();
  }, [fetchMe]);

  const loginWithGoogle = useCallback((returnTo = "/", hint?: string, auto = false, pick = false) => {
    const params = new URLSearchParams({ return: returnTo });
    if (pick) params.set("pick", "1");
    if (hint) params.set("hint", hint);
    if (!pick && auto) params.set("auto", "1");
    // A known email continues that Google account. Picking always opens the account chooser.
    if (!pick && !auto && hint) params.set("mode", "open");
    window.location.href = `/api/auth/login?${params.toString()}`;
  }, []);

  const devLogin = useCallback(
    async (email: string, name?: string) => {
      const res = await fetch("/api/auth/dev-login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Dev login failed");
      }
      await fetchMe();
    },
    [fetchMe],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    clearEventListHold();
    clearAccessSession();
    for (const key of [
      "biyeflow.syncCode",
      "biyeflow_sync_code",
      "biyeflow_wedding_code",
      "biyeflow.accountCode",
      "biyeflow.syncActive",
      "biyeflow.syncMeta",
      "biyeflow.recentAccess",
    ]) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    setState({ status: "anon", user: null, memberships: [], removed: [] });
  }, []);

  const createEvent = useCallback(
    async (name: string, eventType = "wedding") => {
      const res = await fetch("/api/events", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, eventType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create event");
      }
      const data = await res.json();
      await fetchMe();
      return { id: data.event.id, code: data.event.code };
    },
    [fetchMe],
  );

  const renameEvent = useCallback(
    async (eventId: string, name: string) => {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not rename this event");
      }
      await fetchMe();
    },
    [fetchMe],
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not delete this event");
      }
      await fetchMe();
    },
    [fetchMe],
  );

  const restoreEvent = useCallback(
    async (eventId: string) => {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not restore this event");
      }
      await fetchMe();
    },
    [fetchMe],
  );

  const setPasscode = useCallback(
    async (passcode: string) => {
      const res = await fetch("/api/auth/passcode", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", passcode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not set passcode");
      }
      await fetchMe();
    },
    [fetchMe],
  );

  const verifyPasscode = useCallback(async (passcode: string) => {
    const res = await fetch("/api/auth/passcode", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", passcode }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Incorrect passcode");
    }
  }, []);

  const linkLegacyEvent = useCallback(
    async (code: string, role = "admin") => {
      const res = await fetch("/api/events/link-legacy", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, role }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to link event");
      }
      await fetchMe();
    },
    [fetchMe],
  );

  const value = useMemo(
    () => ({
      ...state,
      loginWithGoogle,
      devLogin,
      logout,
      refreshAuth: fetchMe,
      createEvent,
      deleteEvent,
      restoreEvent,
      renameEvent,
      linkLegacyEvent,
      setPasscode,
      verifyPasscode,
    }),
    [state, loginWithGoogle, devLogin, logout, fetchMe, createEvent, deleteEvent, restoreEvent, renameEvent, linkLegacyEvent, setPasscode, verifyPasscode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
