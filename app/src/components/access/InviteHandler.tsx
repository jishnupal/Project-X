import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProfileAvatarPicker, ProfileAvatarBadge } from "./ProfileAvatarPicker";
import { resolveInviteToken } from "../../domain/access/accessApi";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import type { ProfileAvatarId } from "../../domain/access/types";
import { cn } from "../../design-system/cn";

function PinInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      inputMode="numeric"
      maxLength={4}
      placeholder="4-digit PIN"
      className="w-full h-12 rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-4 text-center tracking-[0.5em] text-lg text-primary outline-none"
    />
  );
}

export function InviteHandler() {
  const { kind, token } = useParams<{ kind: string; token: string }>();
  const navigate = useNavigate();
  const { joinWeddingLink, syncCode, showToast } = useWeddingState();
  const { joinGuest, joinBuddy } = useAccess();
  const handled = useRef("");
  const [resolved, setResolved] = useState<{ weddingCode: string; kind: "guest" | "buddy" } | null>(
    null,
  );
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<ProfileAvatarId>("marigold");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const inviteToken = token || "";
    if (!inviteToken || handled.current === inviteToken) return;
    handled.current = inviteToken;
    void (async () => {
      try {
        const row = await resolveInviteToken(inviteToken);
        setResolved({ weddingCode: row.weddingCode, kind: row.kind as "guest" | "buddy" });
        if (syncCode !== row.weddingCode) {
          await joinWeddingLink(row.weddingCode);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Invalid invite link");
      }
    })();
  }, [token, kind, syncCode, joinWeddingLink]);

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
          if (pin.length !== 4) throw new Error("Choose a 4-digit PIN.");
          await joinBuddy({
            inviteToken: token,
            name: name.trim() || "Buddy",
            avatarId,
            pin,
          });
          navigate("/command-center", { replace: true });
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
          onClick={() => navigate("/auth")}
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
            {isBuddy ? "Buddy invite" : "Guest invite"}
          </p>
          <h1 className="font-headline-md text-primary text-[22px]">
            {isBuddy ? "Join as Buddy" : "Welcome to the wedding"}
          </h1>
        </div>
      </div>
      <p className="text-[13px] text-secondary leading-relaxed">
        {isBuddy
          ? "Set your profile and 4-digit PIN. You can edit BUZZ and modules your Admin grants."
          : "Optional: add your name. You will see welcome, invitation, and venue details (BUZZ)."}
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
      {!isBuddy ? <ProfileAvatarPicker value={avatarId} onChange={setAvatarId} /> : null}
      {isBuddy ? (
        <>
          <ProfileAvatarPicker value={avatarId} onChange={setAvatarId} />
          <PinInput value={pin} onChange={setPin} />
        </>
      ) : null}
      <button
        type="button"
        disabled={busy || (isBuddy && pin.length !== 4)}
        onClick={onSubmit}
        className={cn(
          "w-full h-12 rounded-full bg-primary text-on-primary font-button text-[14px] disabled:opacity-40",
        )}
      >
        {busy ? "Joining…" : isBuddy ? "Join as Buddy" : "View BUZZ"}
      </button>
    </div>
  );
}
