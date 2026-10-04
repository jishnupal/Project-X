import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProfileAvatarPicker, ProfileAvatarBadge } from "./ProfileAvatarPicker";
import { resolveInviteToken } from "../../domain/access/accessApi";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { useWeddingState } from "../../hooks/useWeddingState";
import type { ProfileAvatarId } from "../../domain/access/types";
import { cn } from "../../design-system/cn";

export function InviteHandler() {
  const { kind, token } = useParams<{ kind: string; token: string }>();
  const navigate = useNavigate();
  const { joinWeddingLink, syncCode, showToast } = useWeddingState();
  const { joinGuest, joinBuddy, enterAsMember } = useAccess();
  const { status, loginWithGoogle, refreshAuth } = useAuth();
  const handled = useRef("");
  const [resolved, setResolved] = useState<{ weddingCode: string; kind: "guest" | "buddy" } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>("marigold");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteToken = token || "";
    if (!inviteToken || status === "loading") return;
    if (handled.current === `${status}:${inviteToken}`) return;
    handled.current = `${status}:${inviteToken}`;
    if (status !== "authenticated") {
      loginWithGoogle(`/invite/${kind || "guest"}/${inviteToken}`);
      return;
    }
    void (async () => {
      try {
        const response = await fetch("/api/invites/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "accept", token: inviteToken }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          code?: string;
          role?: string;
          error?: string;
          already?: string;
        };
        if (response.ok && data.code) {
          await refreshAuth();
          if (syncCode !== data.code) await joinWeddingLink(data.code);
          if (data.already === "host" || data.role === "admin") {
            navigate("/dashboard", { replace: true });
            return;
          }
          await enterAsMember(data.code);
          navigate(data.role === "buddy" ? "/buddies" : "/buzz", { replace: true });
          return;
        }
        if (response.status !== 404) {
          setError(data.error || "Could not accept this invite");
          return;
        }
        const row = await resolveInviteToken(inviteToken);
        setResolved({ weddingCode: row.weddingCode, kind: row.kind as "guest" | "buddy" });
        if (syncCode !== row.weddingCode) await joinWeddingLink(row.weddingCode);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid invite link");
      }
    })();
  }, [token, kind, status, syncCode, joinWeddingLink, loginWithGoogle, refreshAuth, enterAsMember, navigate]);

  const onSubmit = () => {
    if (!resolved || !token) return;
    setBusy(true);
    void (async () => {
      try {
        if (resolved.kind === "guest" || kind === "guest") {
          await joinGuest({
            inviteToken: token,
            name: name.trim() || "Guest",
            avatarId,
          });
          navigate("/buzz", { replace: true });
        } else {
          await joinBuddy({
            inviteToken: token,
            name: name.trim() || "Buddy",
            avatarId,
          });
          navigate("/buddies", { replace: true });
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not join");
      } finally {
        setBusy(false);
      }
    })();
  };

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-3">
        <p className="font-headline-md text-primary text-[22px]">Invite link problem</p>
        <p className="text-sm text-secondary">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="h-11 px-5 rounded-full bg-primary text-on-primary font-button text-[13px]"
        >
          Go to sign in
        </button>
      </div>
    );
  }

  if (!resolved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-3 px-6 text-center">
        <p className="font-headline-md text-primary text-[22px]">Opening invite…</p>
      </div>
    );
  }

  const isBuddy = resolved.kind === "buddy" || kind === "buddy";

  return (
    <div className="max-w-lg mx-auto py-8 px-1 space-y-5">
      <div className="flex items-center gap-3">
        <ProfileAvatarBadge avatarId={avatarId} size={48} />
        <div>
          <p className="font-label-caps text-[9px] tracking-[0.14em] text-secondary">
            {isBuddy ? "Buddies" : "Guest invite"}
          </p>
          <h1 className="font-headline-md text-primary text-[22px]">
            {isBuddy ? "Your tasks" : "Welcome"}
          </h1>
        </div>
      </div>
      <p className="text-[13px] text-secondary leading-relaxed">
        {isBuddy
          ? "Add your name. You will only see tasks, and you can mark them done."
          : "Add your name if you want. You will see the welcome, invitation, and venue."}
      </p>
      <label className="block">
        <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">Your name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isBuddy ? "Your name" : "Optional"}
          className="mt-1.5 w-full h-11 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 text-primary outline-none"
        />
      </label>
      <ProfileAvatarPicker value={avatarId} onChange={setAvatarId} />
      <button
        type="button"
        disabled={busy}
        onClick={onSubmit}
        className={cn(
          "w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px] disabled:opacity-40",
        )}
      >
        {busy ? "Joining…" : isBuddy ? "See tasks" : "View Buzz"}
      </button>
    </div>
  );
}
