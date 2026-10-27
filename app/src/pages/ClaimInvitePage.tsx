import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  GuestInviteLanding,
  type GuestInviteAcceptResult,
} from "../components/guest/GuestInviteLanding";
import { getOrCreateDeviceId } from "../domain/access/deviceLocal";
import { useAccess } from "../hooks/useAccess";
import { useAuth } from "../hooks/useAuth";
import { useWeddingState } from "../hooks/useWeddingState";

type Preview = {
  token: string;
  claimCode: string | null;
  name: string;
  role: "guest" | "buddy";
  eventName: string;
  eventCode: string;
  dateLine?: string;
  buzz: {
    welcomeTitle: string;
    welcomeMessage: string;
    invitationNote: string;
    venueName: string;
    passArtUrl?: string;
    letterPhotoUrl?: string;
  };
  nextDay: string;
};

const INVITE_RESUME_KEY = "biyeflow.inviteResume";
const INVITE_PATH_KEY = "biyeflow.invitePath";
const INVITE_RSVP_KEY = "biyeflow.inviteRsvp";
const VIEWER_NAME_KEY = "biyeflow.viewerName";

function deviceLabel() {
  try {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad/i.test(ua)) return "iPhone";
    if (/Android/i.test(ua)) return "Android";
  } catch {
    /* ignore */
  }
  return "Phone";
}

function hasRealProfile(user: { provisional?: boolean; email?: string } | null | undefined) {
  if (!user) return false;
  if (user.provisional) return false;
  const email = String(user.email || "");
  return !email.includes("@pending.biyeflow.local");
}

function readStored(key: string) {
  try {
    return sessionStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeStored(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function clearInviteResume() {
  try {
    sessionStorage.removeItem(INVITE_RESUME_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Public invite door: banner → scan → film?/note? → Buzz peek → RSVP
 * → signup (if needed) → print + stamp → Buzz.
 */
export function ClaimInvitePage() {
  const { kind, token, code } = useParams<{ kind?: string; token?: string; code?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { joinWeddingLink, showToast } = useWeddingState();
  const { enterAsMember } = useAccess();
  const { user, status, refreshAuth } = useAuth();
  const key = token || code || "";

  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [claimed, setClaimed] = useState<{
    code: string;
    role?: string;
    guestId?: string;
  } | null>(null);
  const [resumeScene, setResumeScene] = useState<"receipt" | null>(() =>
    readStored(INVITE_RESUME_KEY) === "receipt" ? "receipt" : null,
  );
  const claimedRef = useRef<typeof claimed>(null);
  const claimOnce = useRef(false);
  const displayNameRef = useRef("");
  const resumeStarted = useRef(false);

  useEffect(() => {
    if (!key) return;
    void (async () => {
      try {
        const res = await fetch(`/api/invites/preview?token=${encodeURIComponent(key)}`);
        const data = (await res.json().catch(() => ({}))) as Preview & { error?: string };
        if (!res.ok) {
          setError(data.error || "Invite not found");
          return;
        }
        setPreview(data);
        const storedName = readStored(VIEWER_NAME_KEY);
        displayNameRef.current =
          storedName || user?.name?.trim() || data.name || "";
      } catch {
        setError("Could not open this invite");
      }
    })();
  }, [key, user?.name]);

  const invitePath = useMemo(() => {
    const path = `${location.pathname}${location.search || ""}`;
    return path.startsWith("/claim") || path.startsWith("/invite")
      ? path.split("?")[0] || path
      : key
        ? `/claim/${encodeURIComponent(key)}`
        : "/claim";
  }, [location.pathname, location.search, key]);

  const finishEnter = async (payload: {
    code: string;
    role?: string;
    guestId?: string;
  }) => {
    const name = displayNameRef.current.trim() || preview?.name || "";
    writeStored(VIEWER_NAME_KEY, name);
    if (payload.guestId) writeStored("biyeflow.claimGuestId", payload.guestId);
    clearInviteResume();
    await refreshAuth();
    await joinWeddingLink(payload.code);
    await enterAsMember(payload.code);
    const role = payload.role || preview?.role || kind || "guest";
    navigate(role === "buddy" ? "/buddies" : "/buzz", { replace: true });
  };

  const acceptWithSession = async (inviteToken: string) => {
    const res = await fetch("/api/invites/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: "accept", token: inviteToken }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      code?: string;
      role?: string;
      guestId?: string;
      error?: string;
    };
    if (!res.ok || !data.code) throw new Error(data.error || "Could not claim invite");
    return data;
  };

  const claimDeviceFallback = async (claimKey: string) => {
    const deviceId = getOrCreateDeviceId();
    const res = await fetch("/api/invites/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        code: claimKey.trim(),
        deviceId,
        deviceLabel: deviceLabel(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      code?: string;
      role?: string;
      guestId?: string;
      error?: string;
    };
    if (!res.ok || !data.code) throw new Error(data.error || "Could not claim invite");
    return data;
  };

  const softClaim = async (preferSession: boolean) => {
    if (claimedRef.current?.code) return claimedRef.current;
    if (!preview || claimOnce.current) return claimedRef.current;
    claimOnce.current = true;
    try {
      const data =
        preferSession && hasRealProfile(user)
          ? await acceptWithSession(preview.token)
          : await claimDeviceFallback(preview.claimCode || preview.token);
      if (!data.code) throw new Error("Could not claim invite");
      const next = { code: data.code, role: data.role, guestId: data.guestId };
      claimedRef.current = next;
      setClaimed(next);
      await refreshAuth();
      return next;
    } catch (err) {
      claimOnce.current = false;
      showToast(err instanceof Error ? err.message : "Could not save invite");
      return null;
    }
  };

  /** After Google signup, resume at print + stamp */
  useEffect(() => {
    if (!preview || status === "loading" || resumeStarted.current) return;
    if (readStored(INVITE_RESUME_KEY) !== "receipt") return;
    if (!hasRealProfile(user)) return;

    resumeStarted.current = true;
    const storedName = readStored(VIEWER_NAME_KEY);
    displayNameRef.current =
      storedName || user?.name?.trim() || preview.name || "Guest";
    setResumeScene("receipt");
    clearInviteResume();
    void softClaim(true);
  }, [preview, status, user]);

  const onAccept = async (
    rsvp: "yes" | "maybe",
    displayName: string,
  ): Promise<GuestInviteAcceptResult> => {
    const name =
      displayName.trim() ||
      user?.name?.trim() ||
      preview?.name ||
      "Guest";
    displayNameRef.current = name;
    writeStored(INVITE_RSVP_KEY, rsvp);
    writeStored(VIEWER_NAME_KEY, name);
    writeStored(INVITE_PATH_KEY, invitePath);

    if (hasRealProfile(user)) {
      await softClaim(true);
      return "continue";
    }

    writeStored(INVITE_RESUME_KEY, "receipt");
    const params = new URLSearchParams({
      intent: "invite",
      signup: "1",
      return: invitePath,
    });
    navigate(`/login?${params.toString()}`, { replace: false });
    return "auth";
  };

  const onEnterEvent = (displayName: string) => {
    if (busy) return;
    displayNameRef.current =
      displayName.trim() || user?.name?.trim() || preview?.name || "Guest";
    writeStored(VIEWER_NAME_KEY, displayNameRef.current);
    setBusy(true);
    void (async () => {
      try {
        const payload = await softClaim(hasRealProfile(user));
        if (!payload?.code) throw new Error("Could not open event");
        await finishEnter(payload);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not open event");
      } finally {
        setBusy(false);
      }
    })();
  };

  const onStoreTap = (store: "apple" | "google") => {
    showToast(
      store === "apple"
        ? "App Store listing coming soon — keep this tab for your pass"
        : "Google Play listing coming soon — keep this tab for your pass",
    );
  };

  const letterNote = useMemo(() => {
    if (!preview) return "";
    return (
      preview.buzz.invitationNote?.trim() ||
      preview.buzz.welcomeMessage?.trim() ||
      "You're invited — we'd love to have you with us."
    );
  }, [preview]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center space-y-3">
        <p className="font-headline-md text-[22px] text-primary">Invite problem</p>
        <p className="text-sm text-secondary">{error}</p>
        <div className="pt-4 space-y-2">
          <p className="text-[12px] font-bold text-[#7a6f62]">Have a code?</p>
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            placeholder="Enter claim code"
            className="h-11 w-full rounded-full border border-black/10 px-4 text-center font-bold tracking-widest"
          />
          <button
            type="button"
            disabled={busy || !manualCode.trim()}
            onClick={() => {
              setError("");
              navigate(`/claim/${manualCode.trim()}`, { replace: true });
            }}
            className="h-11 w-full rounded-full bg-[#1a100c] text-white text-[13px] font-extrabold disabled:opacity-40"
          >
            Open pass
          </button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center px-6">
        <p className="font-headline-md text-[22px] text-primary">Opening your pass…</p>
      </div>
    );
  }

  const guestName =
    displayNameRef.current.trim() ||
    readStored(VIEWER_NAME_KEY) ||
    user?.name?.trim() ||
    preview.name;

  const buzzPeek = {
    eventName: preview.eventName,
    guestName,
    venueName: preview.buzz.venueName,
    welcomeTitle: preview.buzz.welcomeTitle,
    scheduleHeadline: preview.nextDay || preview.dateLine || preview.eventName,
    scheduleDetail: preview.dateLine || "",
    countdownTarget: preview.dateLine || "",
    days: preview.nextDay
      ? [
          {
            id: 1,
            name: preview.nextDay,
            day: "—",
            month: "DAY",
            weekday: "IN",
            detail: preview.dateLine || preview.nextDay,
          },
        ]
      : [],
    playEnabled: true,
  };

  return (
    <GuestInviteLanding
      mode="live"
      busy={busy}
      initialScene={resumeScene || undefined}
      buzzPeek={buzzPeek}
      pass={{
        eventName: preview.eventName,
        guestName,
        dateLine: preview.dateLine || preview.nextDay,
        venueName: preview.buzz.venueName,
        claimCode: preview.claimCode,
        backgroundUrl: preview.buzz.passArtUrl || null,
      }}
      letter={{
        templateId: "classic",
        eventName: preview.eventName,
        guestName,
        welcomeTitle: preview.buzz.welcomeTitle,
        welcomeMessage: letterNote,
        note: "",
        venueName: preview.buzz.venueName,
        photoUrl: preview.buzz.letterPhotoUrl || null,
      }}
      onAccept={onAccept}
      onEnterEvent={onEnterEvent}
      onContinueBrowser={onEnterEvent}
      onStoreTap={onStoreTap}
    />
  );
}
