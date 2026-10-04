import type { Room } from "../../domain/types";
import { roomKindSummary } from "../../domain/rooms";
import { cn } from "../../design-system/cn";

type RoomMixCardProps = {
  rooms: Room[];
  dayLabel?: string;
};

export function RoomMixCard({ rooms, dayLabel }: RoomMixCardProps) {
  const kinds = roomKindSummary(rooms);
  const total = rooms.length;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] min-h-[132px]",
        "bg-[linear-gradient(135deg,#ffd4b0_0%,#f3b894_42%,#e89a6e_100%)]",
        "px-5 py-5",
        "shadow-[0_16px_36px_-18px_rgba(196,90,58,0.35)]",
      )}
      aria-label="Room mix"
    >
      <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2" aria-hidden>
        <span className="absolute right-8 top-[-28px] h-24 w-24 rounded-full bg-white/25" />
        <span className="absolute right-0 top-[-8px] h-36 w-36 rounded-full border-[14px] border-white/20" />
        <span className="absolute right-14 bottom-[-36px] h-16 w-16 rounded-full bg-[#1a100c]/10" />
      </div>

      <div className="relative z-[1]">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7a3e22]/75">
          {dayLabel ? `${dayLabel} stay` : "Stay"}
        </p>

        <div className="mt-1.5 flex items-end gap-2">
          <p className="font-display text-[3.05rem] font-black leading-[0.9] tracking-[-0.04em] text-[#1a100c] tabular-nums drop-shadow-[0_2px_0_rgba(255,255,255,0.35)]">
            {total}
          </p>
          <p className="mb-1.5 text-[13px] font-bold text-[#6b3d28]">
            {total === 1 ? "room" : "rooms"}
          </p>
        </div>

        {kinds.length ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {kinds.map((item) => (
              <span
                key={item.kind}
                className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-full bg-[#1a100c] text-white shadow-[0_8px_16px_-10px_rgba(26,16,12,0.55)]"
              >
                <span className="text-[15px] font-black tabular-nums leading-none">{item.count}</span>
                <span className="text-[11px] font-bold text-white/80">{item.label}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[12px] font-bold text-[#6b3d28]">
            Double · Triple · Quad — add your first room
          </p>
        )}
      </div>
    </section>
  );
}
