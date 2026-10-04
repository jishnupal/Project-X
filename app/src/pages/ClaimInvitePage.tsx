import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  buzz: {
    welcomeTitle: string;
    welcomeMessage: string;
    invitationNote: string;
    venueName: string;
  };
  nextDay: string;
  playEnabled: boolean;
  teaser: {
    question: { id: string; prompt: string; options: string[] } | null;
    board: Array<{ name: string; points: number }>;
    playing: number;
  };
};

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

/** Public invite door: letter free, play gated behind claim. */
export function ClaimInvitePage() {
  const { kind, token, code } = useParams<{ kind?: string; token?: string; code?: string }>();
  const navigate = useNavigate();
  const { joinWeddingLink, showToast } = useWeddingState();
  const { enterAsMember } = useAccess();
  const { refreshAuth } = useAuth();
  const key = token || code || "";

  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualCode, setManualCode] = useState("");

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
      } catch {
        setError("Could not open this invite");
      }
    })();
  }, [key]);

  const claim = (claimKey: string) => {
    if (!claimKey.trim() || busy) return;
    setBusy(true);
    void (async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const res = await fetch("/api/invites/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          already?: string;
        };
        if (!res.ok || !data.code) throw new Error(data.error || "Could not claim invite");
        try {
          if (data.guestId) sessionStorage.setItem("biyeflow.claimGuestId", data.guestId);
          if (preview?.name) sessionStorage.setItem("biyeflow.viewerName", preview.name);
        } catch {
          /* ignore */
        }
        await refreshAuth();
        await joinWeddingLink(data.code);
        await enterAsMember(data.code);
        const role = data.role || preview?.role || kind || "guest";
        navigate(role === "buddy" ? "/buddies" : "/buzz", { replace: true });
        showToast("You're in");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Could not claim");
      } finally {
        setBusy(false);
      }
    })();
  };

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
            onClick={() => claim(manualCode)}
            className="h-11 w-full rounded-full bg-[#1a100c] text-white text-[13px] font-extrabold disabled:opacity-40"
          >
            Continue in BiyeFlow
          </button>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center px-6">
        <p className="font-headline-md text-[22px] text-primary">Opening invite…</p>
      </div>
    );
  }

  const q = preview.teaser.question;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-lg bg-[#fff8f5] px-4 pb-10 pt-8 text-[#1a100c]">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#9a5a38]">
        {preview.eventName || "You're invited"}
      </p>
      <h1 className="mt-2 text-[28px] font-semibold leading-tight tracking-[-0.03em]">
        {preview.buzz.welcomeTitle}
      </h1>
      <p className="mt-3 text-[15px] font-medium leading-relaxed text-[#584141]">
        {preview.buzz.welcomeMessage}
      </p>

      <section className="mt-8 rounded-[24px] bg-white/80 p-5 shadow-[0_8px_30px_rgba(26,16,12,0.06)]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">
          Invitation
        </p>
        <p className="mt-3 whitespace-pre-wrap text-[16px] font-medium leading-relaxed">
          {preview.buzz.invitationNote}
        </p>
        {preview.buzz.venueName ? (
          <p className="mt-4 text-[13px] font-semibold text-[#7a6f62]">At {preview.buzz.venueName}</p>
        ) : null}
        {preview.nextDay ? (
          <p className="mt-2 text-[13px] font-semibold text-[#7a6f62]">Next: {preview.nextDay}</p>
        ) : null}
      </section>

      {preview.role === "buddy" ? (
        <p className="mt-5 text-[14px] font-semibold text-[#584141]">
          Your helper tasks unlock in BiyeFlow — along with the event Buzz.
        </p>
      ) : null}

      <section className="mt-8">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">
          The room is open
        </p>
        <p className="mt-2 text-[15px] font-medium text-[#584141]">
          Welcome & your invitation are yours. Trivia, games & the live board live in BiyeFlow —
          where this event&apos;s Buzz is happening.
        </p>

        {q ? (
          <div className="relative mt-4 overflow-hidden rounded-[20px] bg-[#1a100c] p-4 text-white">
            <p className="text-[12px] font-bold uppercase tracking-wide text-white/55">Q1</p>
            <p className="mt-1 text-[16px] font-semibold">{q.prompt}</p>
            <div className="mt-3 space-y-2 blur-sm select-none pointer-events-none opacity-70">
              {(q.options || []).slice(0, 4).map((opt) => (
                <div key={opt} className="rounded-full bg-white/10 px-3 py-2 text-[13px]">
                  {opt}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[12px] font-bold text-[#f3d58a]">Unlock in BiyeFlow to climb the board</p>
          </div>
        ) : null}

        {preview.teaser.board.length ? (
          <div className="mt-4 rounded-[16px] border border-black/8 bg-white/70 px-4 py-3">
            <p className="text-[12px] font-extrabold text-[#7a6f62]">
              {preview.teaser.playing} playing · Top of the board
            </p>
            <ul className="mt-2 space-y-1">
              {preview.teaser.board.slice(0, 3).map((row, i) => (
                <li key={`${row.name}-${i}`} className="flex justify-between text-[14px] font-semibold">
                  <span>
                    {i + 1}. {row.name}
                  </span>
                  <span className="text-[#9a5a38]">{row.points}</span>
                </li>
              ))}
              <li className="flex justify-between text-[14px] font-semibold text-[#7a6f62]">
                <span>You</span>
                <span>—</span>
              </li>
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-[13px] font-semibold text-[#7a6f62]">Be first on the board.</p>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => claim(preview.claimCode || preview.token)}
          className="mt-6 h-12 w-full rounded-full bg-[#e11d3a] text-[14px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "Opening…" : "Continue in BiyeFlow"}
        </button>
        {preview.claimCode ? (
          <p className="mt-3 text-center text-[12px] font-bold tracking-[0.12em] text-[#7a6f62]">
            Code {preview.claimCode}
          </p>
        ) : null}
      </section>
    </div>
  );
}
