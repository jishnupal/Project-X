import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useWeddingState } from "../../hooks/useWeddingState";
import {
  cohostLink,
  fetchCohost,
  inviteCohost,
  revokeCohost,
  type CohostStatus,
} from "../../domain/access/cohostApi";
import { Icon } from "../ui/Icon";

type Phase = "loading" | "signed-out" | "ready" | "not-owner" | "error";

export function CoHostSection({ untitled = false }: { untitled?: boolean }) {
  const { syncCode, showToast } = useWeddingState();
  const { status: authStatus, loginWithGoogle, linkLegacyEvent } = useAuth();
  const [status, setStatus] = useState<CohostStatus | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!syncCode || authStatus === "loading") return;
    let cancelled = false;

    const load = async () => {
      if (authStatus === "anon") {
        setPhase("signed-out");
        return;
      }
      try {
        let next = await fetchCohost(syncCode);
        if (!next) {
          await linkLegacyEvent(syncCode, "admin");
          next = await fetchCohost(syncCode);
        }
        if (cancelled) return;
        if (next?.isOwner) {
          setStatus(next);
          setPhase("ready");
          return;
        }
        setPhase("not-owner");
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load co-host";
        if (/sign in/i.test(message)) {
          setPhase("signed-out");
          return;
        }
        setNote(message);
        setPhase("error");
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [syncCode, authStatus, linkLegacyEvent]);

  if (!syncCode) return null;

  const seat = status?.cohost;
  const link = seat?.token ? cohostLink(seat.token) : "";

  const invite = async () => {
    if (busy || !email.includes("@")) return;
    setBusy(true);
    try {
      const cohost = await inviteCohost(syncCode, email.trim());
      setStatus((current) => (current ? { ...current, cohost } : current));
      setEmail("");
      showToast("Co-host link ready");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not invite");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await revokeCohost(syncCode);
      setStatus((current) => (current ? { ...current, cohost: null } : current));
      setConfirmRemove(false);
      showToast("Co-host removed");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not remove");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-2">
      {untitled ? null : <p className="text-[13px] font-semibold text-[#584141]">Co-host</p>}
      <p className="text-[13px] text-[#584141]">
        One other person can edit this event. They sign in with the Gmail you invite.
      </p>

      {phase === "loading" ? (
        <p className="text-[12px] text-[#7a6f62]">Checking this event…</p>
      ) : null}

      {phase === "signed-out" ? (
        <button
          type="button"
          onClick={() => loginWithGoogle("/profile")}
          className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#424242] text-[16px] font-semibold text-white"
        >
          Sign in with Google to invite
        </button>
      ) : null}

      {phase === "not-owner" ? (
        <p className="text-[12px] text-[#7a6f62]">Only the host who created this event can invite a co-host.</p>
      ) : null}

      {phase === "error" ? <p className="text-[12px] text-[#7a6f62]">{note}</p> : null}

      {phase === "ready" && seat ? (
        <div className="space-y-2">
          <p className="text-[16px] font-extrabold tracking-[-0.03em]">{seat.name || seat.email}</p>
          <p className="text-[13px] text-[#584141]">
            {seat.status === "pending" ? `Waiting for ${seat.email}` : seat.email}
          </p>
          {link ? (
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(link).then(() => showToast("Co-host link copied"));
              }}
              className="flex h-12 w-full items-center gap-2 rounded-full bg-white px-4 text-left"
            >
              <code className="min-w-0 flex-1 truncate text-[12px] font-semibold">{link}</code>
              <Icon name="content_copy" className="text-[18px]" />
            </button>
          ) : null}
          {confirmRemove ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="h-10 flex-1 rounded-xl bg-[#1a100c] text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {busy ? "Removing…" : "Remove co-host"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="h-10 flex-1 rounded-xl border border-[#e5ddd6] text-[13px] font-semibold text-[#7a6f62]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="text-[12px] font-bold text-[#1a100c]"
            >
              {seat.status === "pending" ? "Cancel invite" : "Remove co-host"}
            </button>
          )}
        </div>
      ) : null}

      {phase === "ready" && !seat ? (
        <div className="space-y-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@gmail.com"
            inputMode="email"
            autoComplete="email"
            className="h-12 w-full rounded-full bg-white px-4 text-[15px] outline-none"
          />
          <button
            type="button"
            disabled={busy || !email.includes("@")}
            onClick={() => void invite()}
            className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black disabled:opacity-70"
          >
            {busy ? "Creating link…" : "Invite co-host"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
