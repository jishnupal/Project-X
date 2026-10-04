import { useEffect, useState } from "react";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { cn } from "../../design-system/cn";

type PlayState = {
  enabled: boolean;
  canEdit: boolean;
  questions: Array<{ id: string; prompt: string; options: string[] }>;
  myPoints: number;
  answers: Record<string, { choice: number; correct: boolean }>;
  leaderboard: Array<{ name: string; points: number }>;
};

export function BuzzPlayBoard() {
  const { syncCode, showToast } = useWeddingState();
  const { canEdit: hostEdit, canAccessModule } = useAccess();
  const canHostPlay = hostEdit || canAccessModule("buzz", "edit");
  const [play, setPlay] = useState<PlayState | null>(null);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!syncCode) return;
    setLoadError("");
    try {
      const res = await fetch(`/api/buzz/play?code=${encodeURIComponent(syncCode)}`);
      const data = (await res.json().catch(() => null)) as (PlayState & { error?: string }) | null;
      if (!res.ok || !data) {
        setLoadError(data?.error || "Could not load Buzz play");
        return;
      }
      setPlay(data);
    } catch {
      setLoadError("Could not load Buzz play");
    }
  };

  useEffect(() => {
    void load();
  }, [syncCode]);

  if (!syncCode) {
    return (
      <section className="buzz-play mt-0 mb-5 space-y-3 rounded-[22px] bg-[#fff8f5] px-4 py-4 text-[#1a100c] shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">Buzz play</p>
        <h2 className="text-[20px] font-semibold tracking-[-0.03em]">Trivia & board</h2>
        <p className="text-[13px] font-semibold text-[#7a6f62]">
          Open or create an event first — then you can turn on trivia for guests.
        </p>
      </section>
    );
  }

  if (!play) {
    return (
      <section className="buzz-play mt-0 mb-5 space-y-3 rounded-[22px] bg-[#fff8f5] px-4 py-4 text-[#1a100c] shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">Buzz play</p>
        <h2 className="text-[20px] font-semibold tracking-[-0.03em]">Trivia & board</h2>
        <p className="text-[13px] font-semibold text-[#7a6f62]">
          {loadError || "Opening the living room…"}
        </p>
        {loadError ? (
          <button
            type="button"
            onClick={() => void load()}
            className="h-10 rounded-full bg-[#1a100c] px-4 text-[12px] font-extrabold text-white"
          >
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  const enable = async (enabled: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/buzz/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: syncCode, action: "enable", enabled }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Could not update play");
      showToast(enabled ? "Buzz play is on" : "Buzz play paused");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update play");
    } finally {
      setBusy(false);
    }
  };

  const answer = async (questionId: string, choice: number) => {
    setBusy(true);
    try {
      const res = await fetch("/api/buzz/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: syncCode, action: "answer", questionId, choice }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        correct?: boolean;
        gain?: number;
      };
      if (!res.ok) throw new Error(data.error || "Could not save answer");
      showToast(data.correct ? `Correct · +${data.gain}` : `Nice try · +${data.gain}`);
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not answer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="buzz-play mt-0 mb-5 space-y-4 rounded-[22px] bg-[#fff8f5] px-4 py-4 text-[#1a100c] shadow-[0_12px_28px_rgba(0,0,0,0.28)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9a5a38]">
            Buzz play
          </p>
          <h2 className="text-[20px] font-semibold tracking-[-0.03em]">Trivia & board</h2>
          <p className="mt-1 text-[13px] font-medium text-[#584141]">
            {play.enabled
              ? "Guests climb the board from their invite."
              : canHostPlay
                ? "Open a short trivia pack so guests have something to play."
                : "Play opens when the host turns it on."}
          </p>
        </div>
        {play.enabled ? (
          <p className="text-[13px] font-extrabold text-[#e11d3a]">{play.myPoints} pts</p>
        ) : null}
      </div>

      {canHostPlay || play.canEdit ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void enable(!play.enabled)}
          className="h-11 w-full rounded-full bg-[#e11d3a] px-4 text-[13px] font-extrabold text-white disabled:opacity-40"
        >
          {play.enabled ? "Pause play" : "Open play for guests"}
        </button>
      ) : null}

      {!play.enabled ? (
        canHostPlay ? null : (
          <p className="text-[13px] font-semibold text-[#7a6f62]">
            Come back once the host opens Buzz trivia.
          </p>
        )
      ) : (
        <div className="space-y-4">
          {play.questions.map((q) => {
            const done = play.answers[q.id];
            return (
              <div key={q.id} className="rounded-[18px] bg-[#fff8f5] p-4">
                <p className="text-[15px] font-semibold">{q.prompt}</p>
                <div className="mt-3 grid gap-2">
                  {q.options.map((opt, index) => (
                    <button
                      key={opt}
                      type="button"
                      disabled={busy || Boolean(done)}
                      onClick={() => void answer(q.id, index)}
                      className={cn(
                        "rounded-full px-3 py-2 text-left text-[13px] font-semibold",
                        done
                          ? done.choice === index
                            ? done.correct
                              ? "bg-emerald-100 text-emerald-900"
                              : "bg-rose-100 text-rose-900"
                            : "bg-black/5 text-[#7a6f62]"
                          : "bg-white text-[#1a100c] active:scale-[0.99]",
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {play.leaderboard.length ? (
        <div className="rounded-[18px] border border-black/8 bg-[#fff8f5] px-4 py-3">
          <p className="text-[12px] font-extrabold text-[#7a6f62]">Live board</p>
          <ul className="mt-2 space-y-1">
            {play.leaderboard.slice(0, 10).map((row, i) => (
              <li key={`${row.name}-${i}`} className="flex justify-between text-[14px] font-semibold">
                <span>
                  {i + 1}. {row.name}
                </span>
                <span className="text-[#9a5a38]">{row.points}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : play.enabled ? (
        <p className="text-[13px] font-semibold text-[#7a6f62]">Be first on the board.</p>
      ) : null}
    </section>
  );
}
