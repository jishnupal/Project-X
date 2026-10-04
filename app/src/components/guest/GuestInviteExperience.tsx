import { InviteLetterPreview, type InviteLetterContent } from "./InviteLetterPreview";
import { cn } from "../../design-system/cn";

export type GuestInviteTeaser = {
  question?: { prompt: string; options: string[] } | null;
  board?: Array<{ name: string; points: number }>;
  playing?: number;
  nextDay?: string;
};

type GuestInviteExperienceProps = {
  content: InviteLetterContent;
  teaser?: GuestInviteTeaser;
  /** Host dress-rehearsal: CTA does nothing / shows toast via onContinue */
  mode?: "live" | "preview";
  onContinue?: () => void;
  continueBusy?: boolean;
  continueLabel?: string;
  className?: string;
};

const DEMO_QUESTION = {
  prompt: "Where did they have their first date?",
  options: ["The café on Park Street", "A midnight rickshaw ride", "Cousin’s rooftop", "Still arguing"],
};

const DEMO_BOARD = [
  { name: "Ayesha", points: 120 },
  { name: "Kabir", points: 95 },
  { name: "Meera", points: 80 },
];

/**
 * Full guest invite walkthrough — letter + Buzz FOMO + continue.
 */
export function GuestInviteExperience({
  content,
  teaser,
  mode = "live",
  onContinue,
  continueBusy = false,
  continueLabel,
  className,
}: GuestInviteExperienceProps) {
  const isPreview = mode === "preview";
  const question = teaser?.question === undefined ? DEMO_QUESTION : teaser.question;
  const board = teaser?.board?.length ? teaser.board : isPreview ? DEMO_BOARD : [];
  const playing = teaser?.playing ?? (board.length ? Math.max(board.length + 4, 8) : 0);
  const nextDay = teaser?.nextDay?.trim();

  return (
    <div className={cn("mx-auto w-full max-w-lg text-[#1a100c]", className)}>
      <InviteLetterPreview
        content={content}
        size={isPreview ? "immersive" : "full"}
        className={isPreview ? "invite-letter--enter" : undefined}
      />

      {nextDay ? (
        <p className="mt-5 px-1 text-[13px] font-semibold text-[#7a6f62]">Next up · {nextDay}</p>
      ) : null}

      <section className="mt-9">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#9a5a38]">
          Then the room opens
        </p>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#584141]">
          After they open your letter, guests unlock Buzz — trivia, games, and the live board for
          your event.
        </p>

        {question ? (
          <div className="relative mt-5 overflow-hidden rounded-[24px] bg-[#1a100c] p-5 text-white shadow-[0_16px_40px_rgba(26,16,12,0.2)]">
            <p className="text-[12px] font-bold uppercase tracking-wide text-white/55">Buzz preview</p>
            <p className="mt-2 text-[18px] font-semibold leading-snug">{question.prompt}</p>
            <div className="mt-4 space-y-2 blur-[3px] select-none pointer-events-none opacity-75">
              {(question.options || []).slice(0, 4).map((opt) => (
                <div key={opt} className="rounded-full bg-white/10 px-3.5 py-2.5 text-[13px]">
                  {opt}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1a100c] to-transparent" />
            <p className="relative mt-4 text-[12px] font-bold text-[#f3d58a]">
              Locked until they continue in BiyeFlow
            </p>
          </div>
        ) : null}

        {board.length ? (
          <div className="mt-4 rounded-[20px] border border-black/6 bg-white/80 px-4 py-3.5">
            <p className="text-[12px] font-extrabold text-[#7a6f62]">
              {playing} playing · Top of the board
            </p>
            <ul className="mt-2 space-y-1.5">
              {board.slice(0, 3).map((row, i) => (
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
          disabled={continueBusy || (isPreview && !onContinue)}
          onClick={onContinue}
          className={cn(
            "mt-7 h-12 w-full rounded-full text-[14px] font-extrabold text-white transition active:scale-[0.99]",
            isPreview
              ? "bg-[#e11d3a] shadow-[0_12px_28px_rgba(225,29,58,0.28)]"
              : "bg-[#e11d3a] disabled:opacity-50",
          )}
        >
          {isPreview
            ? "Continue in BiyeFlow"
            : continueBusy
              ? "Opening…"
              : continueLabel || "Continue in BiyeFlow"}
        </button>

        {isPreview ? (
          <p className="mt-3 text-center text-[12px] font-medium leading-snug text-[#9a8b82]">
            In preview this just shows the guest path — it won’t open Buzz for you.
          </p>
        ) : null}
      </section>
    </div>
  );
}
