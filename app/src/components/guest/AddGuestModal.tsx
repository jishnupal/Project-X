import { useEffect, useMemo, useRef, useState } from "react";
import type { GuestDraft } from "../../domain/guest";
import { emptyGuestDraft, parseCount } from "../../domain/guest";
import { functionIds, resolveDayName } from "../../domain/functions";
import { useWeddingState } from "../../hooks/useWeddingState";
import { cn } from "../../design-system/cn";
import { Icon } from "../ui/Icon";

type AddGuestModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (draft: GuestDraft) => void;
};

type EventKey = "sangeetCount" | "biyebariCount" | "receptionCount" | "borjatriCount";

const DAY_EVENT_META: Record<
  number,
  { key: EventKey; icon: string }
> = {
  1: { key: "sangeetCount", icon: "music_note" },
  2: { key: "biyebariCount", icon: "favorite" },
  3: { key: "receptionCount", icon: "celebration" },
  4: { key: "borjatriCount", icon: "event" },
};

function padCount(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

function MaroonToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-[rgba(128,0,32,0.18)]",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function CountChip({
  value,
  min,
  max,
  onChange,
  size = "sm",
}: {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  size?: "sm" | "lg";
}) {
  const step = (delta: number) => onChange(Math.max(min, Math.min(max, value + delta)));
  const large = size === "lg";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-full border border-[rgba(128,0,32,0.12)] bg-white",
        large ? "h-16 px-3" : "h-9 px-1.5 min-w-[108px]",
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="Decrease"
        className={cn(
          "rounded-full flex items-center justify-center disabled:opacity-35 transition-transform active:scale-95",
          large
            ? "h-11 w-11 bg-[#f6e4e8] text-primary"
            : "h-7 w-7 bg-[#f6e4e8] text-primary",
        )}
      >
        <Icon name="remove" className={large ? "text-[20px]" : "text-[14px]"} />
      </button>
      <div className="min-w-[3.5rem] text-center leading-none">
        <p
          className={cn(
            "font-headline-xl text-primary tabular-nums",
            large ? "text-[28px]" : "text-[15px] font-headline-md",
          )}
        >
          {padCount(value)}
        </p>
        {large ? (
          <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary/55 mt-0.5">
            Members
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Increase"
        className={cn(
          "rounded-full flex items-center justify-center text-white disabled:opacity-35 transition-transform active:scale-95",
          large ? "h-11 w-11 bg-primary shadow-md" : "h-7 w-7 bg-primary shadow-sm",
        )}
      >
        <Icon name="add" className={large ? "text-[20px]" : "text-[14px]"} />
      </button>
    </div>
  );
}

export function AddGuestModal({ open, onClose, onAdd }: AddGuestModalProps) {
  const { state } = useWeddingState();
  const eventRows = useMemo(
    () =>
      functionIds(state)
        .map((day) => {
          const meta = DAY_EVENT_META[day];
          if (!meta) return null;
          return {
            key: meta.key,
            icon: meta.icon,
            label: resolveDayName(state, day),
          };
        })
        .filter((row): row is NonNullable<typeof row> => Boolean(row)),
    [state],
  );
  const eventSignature = eventRows.map((row) => row.key).join("|");

  const [draft, setDraft] = useState(() => emptyGuestDraft());
  const [stayOn, setStayOn] = useState(false);
  const [eventOn, setEventOn] = useState<Partial<Record<EventKey, boolean>>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const base = emptyGuestDraft();
    const nextOn: Partial<Record<EventKey, boolean>> = {};
    const nextDraft: GuestDraft = {
      ...base,
      count: "1",
      sangeetCount: "0",
      biyebariCount: "0",
      receptionCount: "0",
      borjatriCount: "0",
      stayCount: "0",
    };
    eventRows.forEach((row) => {
      nextOn[row.key] = true;
      nextDraft[row.key] = "1";
    });
    setDraft(nextDraft);
    setStayOn(false);
    setEventOn(nextOn);
    const id = window.setTimeout(() => nameRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
    // Reset only when opening or when the wedding's event list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, eventSignature]);

  if (!open) return null;

  const primary = Math.max(1, parseCount(draft.count) || 1);

  const setPrimary = (next: number) => {
    const value = Math.max(1, next);
    setDraft((prev) => {
      const updated = { ...prev, count: String(value) };
      eventRows.forEach((row) => {
        if (eventOn[row.key]) updated[row.key] = String(value);
      });
      if (stayOn) updated.stayCount = String(value);
      return updated;
    });
  };

  const setEventCount = (key: EventKey, next: number) => {
    const value = Math.max(0, Math.min(primary, next));
    setDraft((prev) => ({ ...prev, [key]: String(value) }));
    setEventOn((prev) => ({ ...prev, [key]: value > 0 }));
  };

  const toggleEvent = (key: EventKey, on: boolean) => {
    setEventOn((prev) => ({ ...prev, [key]: on }));
    setDraft((prev) => ({
      ...prev,
      [key]: on ? String(primary) : "0",
    }));
  };

  const toggleStay = (on: boolean) => {
    setStayOn(on);
    setDraft((prev) => ({
      ...prev,
      stayCount: on ? String(primary) : "0",
    }));
  };

  const submit = () => {
    if (!draft.name.trim()) {
      nameRef.current?.focus();
      return;
    }
    const payload: GuestDraft = {
      ...draft,
      sangeetCount: "0",
      biyebariCount: "0",
      receptionCount: "0",
      borjatriCount: "0",
      stayCount: stayOn ? draft.stayCount || draft.count : "0",
    };
    eventRows.forEach((row) => {
      payload[row.key] = eventOn[row.key] ? draft[row.key] : "0";
    });
    onAdd(payload);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4 add-guest-backdrop"
      role="dialog"
      aria-modal
      aria-labelledby="add-guest-title"
      onClick={onClose}
    >
      <div
        className="add-guest-sheet w-full max-w-md max-h-[92vh] overflow-hidden rounded-t-[28px] sm:rounded-[28px] bg-[#faf6f0] shadow-2xl border border-[rgba(204,167,48,0.28)] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2
                id="add-guest-title"
                className="font-headline-xl text-primary text-[28px] leading-none tracking-tight"
              >
                Add New Guest
              </h2>
              <p className="font-label-caps text-[10px] tracking-[0.18em] text-primary mt-2">
                Guest list management
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-full text-primary/55 hover:text-primary hover:bg-[rgba(128,0,32,0.06)] flex items-center justify-center"
              aria-label="Close"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </div>

          <label className="block mt-4">
            <span className="font-label-caps text-[9px] tracking-[0.16em] text-primary">
              Family name
            </span>
            <input
              ref={nameRef}
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g. Banerjee family"
              autoComplete="off"
              className="mt-1.5 w-full h-12 rounded-2xl border border-[rgba(128,0,32,0.14)] bg-white px-4 text-sm outline-none focus:border-[#cca730] focus:shadow-[0_0_0_3px_rgba(204,167,48,0.18)]"
            />
          </label>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-3 space-y-5">
          <section>
            <p className="font-label-caps text-[9px] tracking-[0.16em] text-primary mb-2">
              Primary guest count
            </p>
            <CountChip value={primary} min={1} max={99} onChange={setPrimary} size="lg" />
          </section>

          <section>
            <p className="font-label-caps text-[9px] tracking-[0.16em] text-primary mb-2">
              Event invitations
            </p>
            <div className="space-y-1">
              {eventRows.map((row) => {
                const count = parseCount(draft[row.key]);
                const on = Boolean(eventOn[row.key]);
                return (
                  <div
                    key={row.key}
                    className="flex items-center gap-2.5 py-2.5 border-b border-[rgba(128,0,32,0.06)] last:border-0"
                  >
                    <span className="h-8 w-8 rounded-lg bg-[rgba(128,0,32,0.06)] text-primary flex items-center justify-center shrink-0">
                      <Icon name={row.icon} className="text-[18px]" />
                    </span>
                    <p className="flex-1 min-w-0 font-label-caps text-[11px] tracking-[0.1em] text-primary">
                      {row.label}
                    </p>
                    <CountChip
                      value={on ? Math.max(1, count) : 0}
                      min={0}
                      max={primary}
                      onChange={(next) => setEventCount(row.key, next)}
                    />
                    <MaroonToggle
                      checked={on}
                      onChange={(next) => toggleEvent(row.key, next)}
                      label={`Invite to ${row.label}`}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl bg-[#f3e0e4] px-3.5 py-3.5 flex items-center gap-3">
            <span className="h-11 w-11 rounded-xl bg-white text-primary flex items-center justify-center shrink-0 shadow-sm">
              <Icon name="hotel" className="text-[22px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-headline-md text-primary text-[15px] leading-tight">
                Accommodation Required
              </p>
              <p className="text-[11px] text-primary/55 mt-0.5 leading-snug">
                Toggle if stay is needed for this family
              </p>
            </div>
            <MaroonToggle
              checked={stayOn}
              onChange={toggleStay}
              label="Accommodation required"
            />
          </section>
        </div>

        <div className="shrink-0 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] bg-[#faf6f0]">
          <button
            type="button"
            onClick={submit}
            className="add-guest-confirm relative w-full h-14 rounded-full bg-primary text-on-primary font-label-caps text-[13px] tracking-[0.14em] overflow-hidden shadow-[0_16px_32px_-12px_rgba(128,0,32,0.55)] hover:brightness-110 active:scale-[0.985] transition-[transform,filter]"
          >
            <span className="relative z-[1]">Confirm &amp; Add Guest</span>
          </button>
        </div>
      </div>
    </div>
  );
}
