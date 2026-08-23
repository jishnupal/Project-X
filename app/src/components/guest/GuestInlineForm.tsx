import { useState } from "react";
import type { GuestDraft } from "../../domain/guest";
import { emptyGuestDraft, parseCount } from "../../domain/guest";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type GuestInlineFormProps = {
  onAdd: (draft: GuestDraft) => void;
  onCancel?: () => void;
  className?: string;
  variant?: "default" | "premium";
};

const COUNT_FIELDS: Array<{ key: keyof GuestDraft; label: string; short: string }> = [
  { key: "count", label: "Total", short: "Total" },
  { key: "receptionCount", label: "Reception", short: "Recp." },
  { key: "sangeetCount", label: "Sangeet", short: "Sang." },
  { key: "biyebariCount", label: "Marriage", short: "Marr." },
  { key: "borjatriCount", label: "Borjatri", short: "Borj." },
  { key: "stayCount", label: "Stay", short: "Stay" },
];

export function GuestInlineForm({
  onAdd,
  onCancel,
  className,
  variant = "default",
}: GuestInlineFormProps) {
  const [draft, setDraft] = useState(emptyGuestDraft);
  const [receptionTouched, setReceptionTouched] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(variant === "premium");

  const updateField = (key: keyof GuestDraft, value: string) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "count" && !receptionTouched) {
        next.receptionCount = value || "1";
      }
      if (key === "receptionCount") setReceptionTouched(true);
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onAdd(draft);
    setDraft(emptyGuestDraft());
    setReceptionTouched(false);
    setMobileOpen(variant === "premium");
  };

  const formFields = (
    <>
      <label className="flex flex-col gap-1 grow min-w-[180px] md:min-w-[220px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 px-1">
          Guest / family name
        </span>
        <input
          id="guest-inline-name"
          value={draft.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Enter name..."
          autoComplete="off"
          className={cn(
            "px-3 py-3 rounded-xl border border-outline-variant/30 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-sm font-medium",
            variant === "premium" && "shadow-sm",
          )}
        />
      </label>
      {COUNT_FIELDS.map((field) => (
        <label key={field.key} className="flex flex-col gap-1 w-20 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 text-center">
            <span className="hidden md:inline">{field.label}</span>
            <span className="md:hidden">{field.short}</span>
          </span>
          <input
            type="number"
            min={field.key === "count" ? 1 : 0}
            value={draft[field.key]}
            onChange={(e) => updateField(field.key, e.target.value)}
            className="text-center px-2 py-3 rounded-xl border border-outline-variant/30 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-body-sm tabular-nums font-bold"
          />
        </label>
      ))}
      <button
        type="submit"
        className="bg-primary text-white px-5 py-3 rounded-xl font-black text-[12px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shrink-0 self-end flex items-center gap-2 shadow-md"
        aria-label="Add guest"
      >
        <Icon name="add" className="text-[18px]" />
        Add
      </button>
    </>
  );

  if (variant === "premium") {
    return (
      <div className={cn("border-t border-outline-variant/20 bg-white", className)}>
        <form onSubmit={handleSubmit} className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-black uppercase tracking-widest text-primary">New guest group</p>
            {onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="text-on-surface-variant hover:text-primary transition-colors"
                aria-label="Close add guest form"
              >
                <Icon name="close" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-3 md:gap-4">{formFields}</div>
          <p className="mt-4 text-[11px] text-on-surface-variant/70">
            Reception defaults to total. Set event counts to 0 if not invited.
            {parseCount(draft.stayCount) > 0 ? " Stay count enables accommodation." : ""}
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className={cn("bg-surface-container-lowest", className)}>
      <button
        type="button"
        className="md:hidden w-full flex items-center justify-between px-4 py-3 border-b border-outline-variant text-primary font-button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
      >
        <span className="flex items-center gap-2">
          <Icon name="person_add" className="text-[18px]" />
          Add guest inline
        </span>
        <Icon name={mobileOpen ? "expand_less" : "expand_more"} />
      </button>

      <form onSubmit={handleSubmit} className={cn("p-4 md:p-6", !mobileOpen && "hidden md:block")}>
        <div className="flex flex-wrap items-end gap-3 md:gap-4">{formFields}</div>
        <p className="mt-3 text-[11px] text-on-surface-variant/80 italic">
          Reception defaults to total. Set event counts to 0 if not invited.
          {parseCount(draft.stayCount) > 0 ? " Stay count enables accommodation." : ""}
        </p>
      </form>
    </div>
  );
}
