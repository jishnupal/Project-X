import { useMemo, useState } from "react";
import {
  createGuestFromDraft,
  formatGuestPlan,
  GUEST_FUNCTION_DIALS,
  guestMatchesFilter,
  guestMetrics,
  guestsByFunctionDay,
  syncEventGuestCount,
  type GuestDraft,
  type GuestFunctionDay,
} from "../../domain/guest";
import { resolveDayName } from "../../domain/functions";
import type { GuestRow } from "../../domain/types";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { FunctionDialCard } from "./FunctionDialCard";
import { GuestInlineForm } from "./GuestInlineForm";
import { GuestMetricCards } from "./GuestMetricCards";
import { GuestRowCard } from "./GuestRowCard";

export function GuestBoard() {
  const { state, setState, showToast } = useWeddingState();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDay, setActiveDay] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const metrics = useMemo(() => guestMetrics(state.guests), [state.guests]);

  const dialMax = useMemo(
    () => Math.max(...GUEST_FUNCTION_DIALS.map((day) => guestsByFunctionDay(state.guests, day)), 1),
    [state.guests],
  );

  const visibleGuests = useMemo(
    () =>
      [...state.guests]
        .filter((row) => guestMatchesFilter(row, searchTerm.trim(), activeDay, state))
        .sort((a, b) =>
          (a.name.trim() || "zzzz").localeCompare(b.name.trim() || "zzzz", undefined, {
            sensitivity: "base",
          }),
        ),
    [state, searchTerm, activeDay],
  );

  const updateGuests = (guests: GuestRow[]) => {
    setState((prev) => ({
      ...prev,
      guests,
      event: { ...prev.event, guests: syncEventGuestCount(guests) },
    }));
  };

  const handleAddGuest = (draft: GuestDraft) => {
    const row = createGuestFromDraft(draft);
    updateGuests([...state.guests, row]);
    setExpandedId(row.id);
    setShowAddForm(false);
    showToast("Guest added");
  };

  const handleUpdateGuest = (row: GuestRow) => {
    updateGuests(state.guests.map((entry) => (entry.id === row.id ? row : entry)));
  };

  const handleDeleteGuest = (id: string) => {
    updateGuests(state.guests.filter((entry) => entry.id !== id));
    if (expandedId === id) setExpandedId(null);
    showToast("Guest removed");
  };

  const toggleDial = (day: GuestFunctionDay) => {
    setActiveDay((current) => (current === day ? "All" : day));
  };

  const copyGuestList = async () => {
    const text = formatGuestPlan(state);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Guest list copied");
    } catch {
      showToast("Could not copy guest list");
    }
  };

  const activeFilterLabel =
    activeDay !== "All" ? resolveDayName(state, Number(activeDay)) : null;

  return (
    <div className="space-y-6 lg:space-y-8">
      <GuestMetricCards
        stayTotal={metrics.stayTotal}
        headTotal={metrics.headTotal}
        inviteSentTotal={metrics.inviteSentTotal}
        familyCount={metrics.familyCount}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="lg:hidden -mx-1 col-span-full">
          <div className="mobile-h-scroll scroll-hide px-1 flex gap-4">
            {GUEST_FUNCTION_DIALS.map((day) => (
              <FunctionDialCard
                key={day}
                day={day}
                guests={state.guests}
                state={state}
                active={activeDay === day}
                maxCount={dialMax}
                onToggle={toggleDial}
                compact
              />
            ))}
          </div>
        </div>
        <div className="hidden lg:contents">
          {GUEST_FUNCTION_DIALS.map((day) => (
            <FunctionDialCard
              key={day}
              day={day}
              guests={state.guests}
              state={state}
              active={activeDay === day}
              maxCount={dialMax}
              onToggle={toggleDial}
            />
          ))}
        </div>
      </section>

      <section className="bg-white rounded-[2rem] premium-card-shadow overflow-hidden border border-outline-variant/20">
        <div className="px-4 md:px-8 py-5 md:py-6 bg-surface-container-low/50 flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-4 lg:gap-6">
          <div className="relative grow max-w-xl w-full">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[22px]"
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search elite guests..."
              autoComplete="off"
              className="w-full pl-12 pr-6 py-3.5 md:py-4 rounded-2xl border-none bg-white shadow-sm focus:ring-2 focus:ring-primary/20 placeholder:text-on-surface-variant/40 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeFilterLabel ? (
              <div className="flex items-center gap-2 bg-primary/5 text-primary px-5 py-2.5 rounded-full border border-primary/10">
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Filtered: {activeFilterLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveDay("All")}
                  className="hover:rotate-90 transition-transform"
                  aria-label="Clear filter"
                >
                  <Icon name="close" className="text-[16px]" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={copyGuestList}
              className="px-4 py-3 rounded-2xl border border-outline-variant/40 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors flex items-center gap-2"
            >
              <Icon name="content_copy" className="text-[18px]" />
              <span className="hidden sm:inline">Copy list</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm((open) => !open);
                if (!showAddForm) {
                  requestAnimationFrame(() => {
                    document.querySelector<HTMLInputElement>("#guest-inline-name")?.focus();
                  });
                }
              }}
              className="px-6 md:px-8 py-3.5 md:py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 bg-primary text-white lg:ml-auto"
            >
              <Icon name="person_add" className="text-[20px]" />
              Add Guest
            </button>
          </div>
        </div>

        {showAddForm ? (
          <GuestInlineForm
            onAdd={handleAddGuest}
            onCancel={() => setShowAddForm(false)}
            variant="premium"
          />
        ) : null}

        <div className="p-4 md:p-8 space-y-3">
          {visibleGuests.length ? (
            visibleGuests.map((row) => (
              <GuestRowCard
                key={row.id}
                row={row}
                state={state}
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId((current) => (current === row.id ? null : row.id))}
                onUpdate={handleUpdateGuest}
                onDelete={() => handleDeleteGuest(row.id)}
              />
            ))
          ) : (
            <div className="px-6 py-16 text-center text-on-surface-variant">
              <Icon name="groups" className="text-[48px] text-outline mb-4 mx-auto" />
              <p className="font-display text-lg font-bold text-on-surface">No guests match this view.</p>
              <p className="text-body-sm mt-2 max-w-md mx-auto">
                {state.guests.length
                  ? "Try clearing the search or function filter."
                  : 'Tap "Add Guest" to add your first guest family.'}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
