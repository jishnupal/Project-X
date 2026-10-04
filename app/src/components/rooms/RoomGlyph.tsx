import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

interface RoomGlyphProps {
  capacity: number;
  filled?: number;
  ghost?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RoomGlyph({
  capacity,
  filled = 0,
  ghost = false,
  size = "md",
}: RoomGlyphProps) {
  const beds = Math.max(1, Math.min(4, capacity));
  const box =
    size === "lg"
      ? "h-[4.5rem] min-w-[4.75rem] px-2.5 py-1.5 rounded-[16px]"
      : size === "sm"
        ? "h-11 min-w-[2.75rem] px-1.5 py-1 rounded-[10px]"
        : "h-14 min-w-[3.5rem] px-2 py-1 rounded-[12px]";
  const dot = size === "lg" ? "w-2.5 h-2.5" : size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const home = size === "lg" ? "text-[18px]" : size === "sm" ? "text-[12px]" : "text-[14px]";

  return (
    <span
      className={cn(
        "inline-flex flex-col items-center justify-center gap-1",
        box,
        ghost
          ? "border border-dashed border-[#1a100c]/22 bg-transparent text-[#1a100c]/35"
          : "bg-[#1a100c] text-white shadow-[0_10px_20px_-14px_rgba(26,16,12,0.45)]",
      )}
      aria-hidden
    >
      <Icon name="home" className={home} />
      <span className="flex items-center gap-1">
        {Array.from({ length: beds }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "rounded-full",
              dot,
              ghost
                ? "bg-[#1a100c]/18"
                : i < filled
                  ? "bg-white"
                  : "bg-white/22",
            )}
          />
        ))}
      </span>
    </span>
  );
}
