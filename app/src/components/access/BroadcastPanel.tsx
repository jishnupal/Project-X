import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useWeddingState } from "../../hooks/useWeddingState";
import { CHEESY_BROADCAST_PRESETS, appendActivity, createActivityItem } from "../../domain/activity";
import { cn } from "../../design-system/cn";

type Audience = "guest" | "buddy" | "all";

export function BroadcastPanel({
  className,
  untitled = false,
}: {
  className?: string;
  untitled?: boolean;
}) {
  const { saveState, state, showToast, syncCode } = useWeddingState();
  const { memberships } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("guest");
  const [busy, setBusy] = useState(false);

  const membership = useMemo(
    () => memberships.find((m) => m.eventCode.toUpperCase() === (syncCode || "").toUpperCase()),
    [memberships, syncCode],
  );

  const send = async () => {
    const t = title.trim();
    if (!t || busy) return;
    if (!membership?.eventId) {
      showToast("Open an event first");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${encodeURIComponent(membership.eventId)}/broadcast`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, body: body.trim(), audience }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        activity?: ReturnType<typeof createActivityItem>;
      };
      if (!res.ok) throw new Error(data.error || "Could not send");
      if (data.activity) {
        saveState(appendActivity(state, data.activity as never));
      } else {
        saveState(
          appendActivity(
            state,
            createActivityItem({
              type: "broadcast",
              title: t,
              body: body.trim() || undefined,
              href: "/buzz",
              audience: audience === "all" ? "all" : audience,
            }),
          ),
        );
      }
      setTitle("");
      setBody("");
      showToast("Broadcast sent");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn("space-y-3", className)}>
      {untitled ? (
        <p className="text-[13px] text-[#584141]">
          Cheesy lines for your guests — Zomato energy.
        </p>
      ) : (
        <div>
          <p className="text-[16px] font-bold tracking-[-0.02em] text-black">Broadcast</p>
          <p className="mt-1 text-[13px] text-[#584141]">
            Cheesy lines for your guests — Zomato energy.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {CHEESY_BROADCAST_PRESETS.map((preset) => (
          <button
            key={preset.title}
            type="button"
            onClick={() => {
              setTitle(preset.title);
              setBody(preset.body);
            }}
            className="h-8 rounded-full bg-white px-3 text-[12px] font-semibold text-[#584141]"
          >
            {preset.title}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="text-[13px] font-semibold text-[#584141]">Title</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 80))}
          className="mt-2 h-12 w-full rounded-full border-0 bg-white px-4 text-[15px] font-semibold outline-none"
          placeholder="Don't ghost the party"
        />
      </label>

      <label className="block">
        <span className="text-[13px] font-semibold text-[#584141]">Line</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 160))}
          rows={2}
          className="mt-2 w-full resize-none rounded-[22px] border-0 bg-white px-4 py-3 text-[15px] font-medium outline-none"
          placeholder="Open Buzz — the latest scoop is waiting."
        />
      </label>

      <div className="flex gap-1.5">
        {(
          [
            ["guest", "Guests"],
            ["buddy", "Buddies"],
            ["all", "Everyone"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAudience(id)}
            className={cn(
              "h-10 flex-1 rounded-full text-[12px] font-semibold",
              audience === id
                ? "bg-[#1a100c] text-white"
                : "bg-white text-[#584141]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={busy || !title.trim()}
        onClick={() => void send()}
        className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black disabled:opacity-70"
      >
        {busy ? "Sending…" : "Send broadcast"}
      </button>
    </section>
  );
}
