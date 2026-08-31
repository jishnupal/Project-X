import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import type { CommandCenterWidgetData } from "../../domain/commandCenterSummary";

type CommandCenterWidgetProps = {
  widget: CommandCenterWidgetData;
  compact?: boolean;
  className?: string;
};

type WidgetAccent = "guests" | "menu" | "stay" | "buzz" | "buddies";

const chipStyles = {
  ok: {
    chip: "bg-emerald-500/12 text-emerald-700",
    dot: "bg-emerald-500",
    label: "Live",
  },
  attention: {
    chip: "bg-[rgba(204,167,48,0.2)] text-[#7a5f0a]",
    dot: "bg-[#cca730]",
    label: "Review",
  },
  empty: {
    chip: "bg-[rgba(128,0,32,0.08)] text-secondary",
    dot: "bg-secondary/40",
    label: "Setup",
  },
} as const;

function widgetAccent(id: string): WidgetAccent {
  if (id === "guests" || id === "menu" || id === "stay" || id === "buzz" || id === "buddies") {
    return id;
  }
  return "menu";
}

function compactCaption(widget: CommandCenterWidgetData): string {
  if (widget.alert) return widget.alert;
  return widget.detail;
}

function GlassWidgetContent({
  widget,
  compact,
  featured,
}: {
  widget: CommandCenterWidgetData;
  compact: boolean;
  featured: boolean;
}) {
  const chip = chipStyles[widget.status];
  const isTextValue = widget.value === "Ready" || widget.value === "Draft";

  const titleClass = featured ? "text-white/65" : "text-secondary";
  const valueClass = featured ? "text-white" : "text-primary";
  const captionClass = featured
    ? widget.alert
      ? "text-[#f3d58a]"
      : "text-white/55"
    : widget.alert
      ? "text-[#8a6f12]"
      : "text-secondary";
  const footerBorder = featured ? "border-white/10" : "border-[rgba(128,0,32,0.06)]";

  return (
    <div className="home-glass-tile__body p-2.5 lg:p-3">
      <div className="flex shrink-0 items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="home-glass-tile__icon">
            <Icon name={widget.icon} className="text-[14px]" />
          </span>
          <p
            className={cn(
              "truncate font-label-caps text-[9px] tracking-[0.12em]",
              titleClass,
            )}
          >
            {widget.title}
          </p>
        </div>
        <span className={cn("home-glass-tile__chip shrink-0", chip.chip)}>
          <span className={cn("home-glass-tile__chip-dot", chip.dot)} aria-hidden />
          {chip.label}
        </span>
      </div>

      <div className={cn("flex min-h-0 flex-1 flex-col justify-end", compact ? "pt-2" : "pt-4")}>
        <p
          className={cn(
            "truncate font-headline-md leading-none tabular-nums",
            valueClass,
            widget.value === "—"
              ? "text-[18px] opacity-45"
              : isTextValue
                ? compact
                  ? "text-[16px]"
                  : "text-[20px]"
                : compact
                  ? "text-[22px]"
                  : "text-[28px]",
          )}
        >
          {widget.value}
        </p>
        {!compact ? (
          <p className={cn("mt-1.5 line-clamp-2 text-[11px] leading-snug", captionClass)}>
            {widget.detail}
          </p>
        ) : null}
      </div>

      <div className={cn("home-glass-tile__footer", footerBorder)}>
        <div className="flex items-center justify-between gap-1">
          <p className={cn("min-w-0 flex-1 truncate text-[9px] leading-tight", captionClass)}>
            {compact ? compactCaption(widget) : widget.alert || "Tap to open module"}
          </p>
          <Icon
            name="arrow_outward"
            className={cn(
              "shrink-0 text-[13px] opacity-40 transition-opacity group-hover:opacity-80",
              featured ? "text-white" : "text-primary",
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function CommandCenterWidget({
  widget,
  compact = false,
  className,
}: CommandCenterWidgetProps) {
  const accent = widgetAccent(widget.id);
  const featured = accent === "guests";
  const chip = chipStyles[widget.status];

  const tileClass = cn(
    "home-glass-tile group home-widget-tile",
    `home-glass-tile--${accent}`,
    widget.status === "attention" && "home-glass-tile--watch",
    widget.status === "empty" && "home-glass-tile--empty",
    !compact && "home-glass-tile--wide p-0",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cca730]/45",
    className,
  );

  if (compact) {
    return (
      <Link to={widget.to} className={tileClass}>
        <span className="home-glass-tile__orb home-glass-tile__orb--tl" aria-hidden />
        <span className="home-glass-tile__orb home-glass-tile__orb--br" aria-hidden />
        <GlassWidgetContent widget={widget} compact featured={featured} />
      </Link>
    );
  }

  return (
    <Link to={widget.to} className={tileClass}>
      <span className="home-glass-tile__orb home-glass-tile__orb--tl" aria-hidden />
      <span className="home-glass-tile__orb home-glass-tile__orb--br" aria-hidden />
      <div className="home-glass-tile__body p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="home-glass-tile__icon h-8 w-8 rounded-lg">
              <Icon name={widget.icon} className="text-[17px]" />
            </span>
            <div className="min-w-0">
              <p className="font-label-caps truncate text-[9px] tracking-[0.14em] text-secondary">
                {widget.title}
              </p>
              <span className={cn("home-glass-tile__chip mt-1", chip.chip)}>
                <span className={cn("home-glass-tile__chip-dot", chip.dot)} aria-hidden />
                {chip.label}
              </span>
            </div>
          </div>
          <Icon
            name="arrow_outward"
            className="shrink-0 text-[16px] text-primary/30 group-hover:text-primary/60"
          />
        </div>

        <div className="mt-auto min-w-0 pt-4">
          <p
            className={cn(
              "font-headline-md leading-none text-primary tabular-nums",
              widget.value === "—"
                ? "text-[22px] text-secondary/45"
                : widget.value === "Ready" || widget.value === "Draft"
                  ? "text-[22px]"
                  : "text-[30px]",
            )}
          >
            {widget.value}
          </p>
          <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-secondary">{widget.detail}</p>
          {widget.alert ? (
            <p className="mt-1.5 truncate text-[10px] font-medium text-[#8a6f12]">{widget.alert}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
