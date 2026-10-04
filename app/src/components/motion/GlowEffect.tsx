import type { CSSProperties } from "react";
import { motion, type Transition } from "motion/react";
import { cn } from "../../design-system/cn";

export type GlowEffectProps = {
  className?: string;
  style?: CSSProperties;
  colors?: string[];
  mode?: "rotate" | "pulse" | "breathe" | "colorShift" | "flowHorizontal" | "static";
  blur?: number | "softest" | "soft" | "medium" | "strong" | "stronger" | "strongest" | "none";
  transition?: Transition;
  scale?: number;
  duration?: number;
};

/** Adapted from motion-primitives Glow Effect (MIT). */
export function GlowEffect({
  className,
  style,
  colors = ["#570013", "#800020", "#cca730", "#f3d58a"],
  mode = "rotate",
  blur = "medium",
  transition,
  scale = 1,
  duration = 5,
}: GlowEffectProps) {
  const base = { repeat: Infinity, duration, ease: "linear" as const };
  const animations = {
    rotate: {
      background: [
        `conic-gradient(from 0deg at 50% 50%, ${colors.join(", ")})`,
        `conic-gradient(from 360deg at 50% 50%, ${colors.join(", ")})`,
      ],
      transition: transition ?? base,
    },
    pulse: {
      background: colors.map((color) => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`),
      scale: [scale, 1.1 * scale, scale],
      opacity: [0.5, 0.8, 0.5],
      transition: transition ?? { ...base, repeatType: "mirror" as const },
    },
    breathe: {
      background: colors.map((color) => `radial-gradient(circle at 50% 50%, ${color} 0%, transparent 100%)`),
      scale: [scale, 1.05 * scale, scale],
      transition: transition ?? { ...base, repeatType: "mirror" as const },
    },
    colorShift: {
      background: colors.map((color, index) => {
        const next = colors[(index + 1) % colors.length];
        return `conic-gradient(from 0deg at 50% 50%, ${color} 0%, ${next} 50%, ${color} 100%)`;
      }),
      transition: transition ?? { ...base, repeatType: "mirror" as const },
    },
    flowHorizontal: {
      background: colors.map((color) => {
        const next = colors[(colors.indexOf(color) + 1) % colors.length];
        return `linear-gradient(to right, ${color}, ${next})`;
      }),
      transition: transition ?? { ...base, repeatType: "mirror" as const },
    },
    static: {
      background: `linear-gradient(to right, ${colors.join(", ")})`,
    },
  };

  const blurClass =
    typeof blur === "number"
      ? `blur-[${blur}px]`
      : {
          softest: "blur-xs",
          soft: "blur-sm",
          medium: "blur-md",
          strong: "blur-lg",
          stronger: "blur-xl",
          strongest: "blur-2xl",
          none: "blur-none",
        }[blur];

  return (
    <motion.div
      style={{ ...style, ["--glow-scale" as string]: String(scale), willChange: "transform" }}
      animate={animations[mode]}
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full scale-(--glow-scale) transform-gpu",
        blurClass,
        className,
      )}
    />
  );
}
