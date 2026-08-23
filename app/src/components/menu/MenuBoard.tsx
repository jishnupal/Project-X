import { useEffect, useMemo, useState } from "react";
import { MENU_ADD_ON_ITEMS } from "../../domain/defaults";
import {
  functionIds,
  canRemoveWeddingFunction,
  removeWeddingFunction,
  resolveDayName,
  resolveFunctionDateLabel,
} from "../../domain/functions";
import {
  MENU_COURSES,
  addAddOnItemToMenu,
  formatMenuPlan,
  getMenuRow,
  menuBalanceSuggestions,
  menuFeaturedRow,
} from "../../domain/menu";
import {
  menuCommercialEstimate,
  menuCommercialPlateCount,
} from "../../domain/menuDisplay";
import type { MenuCourse, MenuRow } from "../../domain/types";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { CommercialDial } from "./CommercialDial";
import { CommercialDialPopup } from "./CommercialDialPopup";
import { FeaturedMealCard } from "./FeaturedMealCard";
import { MiniMealCard, AiMenuGeneratorCTA } from "./MiniMealCard";
import { MenuDetailModal } from "./MenuDetailModal";
import { BalanceCheckModal } from "./BalanceCheckModal";
import { MenuAssistModal } from "./MenuAssistModal";
import { DayPill } from "./DayPill";

export function MenuBoard() {
  const { state, setState, showToast, lastCreatedFunctionId, clearLastCreatedFunctionId } =
    useWeddingState();
  const dayIds = useMemo(() => functionIds(state), [state]);
  const [activeDay, setActiveDay] = useState(() => dayIds[1] ?? dayIds[0] ?? 2);
  const [detailRowId, setDetailRowId] = useState<string | null>(null);
  const [commercialRowId, setCommercialRowId] = useState<string | null>(null);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);
  const [removingDayId, setRemovingDayId] = useState<number | null>(null);

  const detailRow = useMemo(
    () => (detailRowId ? state.menu.find((row) => row.id === detailRowId) ?? null : null),
    [state, detailRowId],
  );
  const commercialRow = useMemo(
    () =>
      commercialRowId ? state.menu.find((row) => row.id === commercialRowId) ?? null : null,
    [state, commercialRowId],
  );

  useEffect(() => {
    if (!dayIds.includes(activeDay)) setActiveDay(dayIds[0] ?? 2);
  }, [dayIds, activeDay]);

  useEffect(() => {
    if (lastCreatedFunctionId && dayIds.includes(lastCreatedFunctionId)) {
      setActiveDay(lastCreatedFunctionId);
      clearLastCreatedFunctionId();
    }
  }, [lastCreatedFunctionId, dayIds, clearLastCreatedFunctionId]);

  const dayRows = useMemo(
    () => MENU_COURSES.map((course) => getMenuRow(state, activeDay, course)),
    [state, activeDay],
  );
  const featured = useMemo(() => menuFeaturedRow(dayRows), [dayRows]);
  const sideRows = useMemo(
    () => dayRows.filter((row) => row.id !== featured.id),
    [dayRows, featured.id],
  );

  const handleDeleteDay = (dayId: number) => {
    const name = resolveDayName(state, dayId);
    setRemovingDayId(dayId);
    window.setTimeout(() => {
      setState((prev) => removeWeddingFunction(prev, dayId));
      setRemovingDayId(null);
      showToast(`${name} removed`);
    }, 320);
  };

  const balanceIssues = useMemo(() => {
    const label = resolveDayName(state, activeDay);
    return menuBalanceSuggestions(state, 8).filter((issue) => issue.startsWith(label));
  }, [state, activeDay]);

  const updateMenuRow = (updated: MenuRow, quiet = false) => {
    setState((prev) => ({
      ...prev,
      menu: prev.menu.map((row) => (row.id === updated.id ? updated : row)),
    }));
    if (!quiet) showToast("Menu saved");
  };

  const shareMenuPlan = async () => {
    try {
      await navigator.clipboard.writeText(formatMenuPlan(state));
      showToast("Menu plan copied");
    } catch {
      showToast("Copy failed");
    }
  };

  const handleAddOn = (addOnId: string, day: number, course: MenuCourse) => {
    setState(addAddOnItemToMenu(state, addOnId, day, course, MENU_ADD_ON_ITEMS));
    setActiveDay(day);
    showToast("Item added to menu");
  };

  const renderDayPill = (day: number, compact = false) => (
    <DayPill
      key={day}
      isActive={activeDay === day}
      name={resolveDayName(state, day)}
      dateLabel={resolveFunctionDateLabel(state, day)}
      canDelete={canRemoveWeddingFunction(state, day)}
      isRemoving={removingDayId === day}
      compact={compact}
      onSelect={() => setActiveDay(day)}
      onDelete={() => handleDeleteDay(day)}
    />
  );

  const renderDial = (row: MenuRow, compact = false) => (
    <CommercialDial
      key={row.id}
      row={row}
      plates={menuCommercialPlateCount(state, row)}
      estimate={menuCommercialEstimate(state, row)}
      compact={compact}
      onClick={() => setCommercialRowId(row.id)}
    />
  );

  return (
    <>
      <div className="bento-card mobile-card rounded-2xl lg:rounded-xl overflow-hidden flex flex-col">
        {/* ——— Mobile layout ——— */}
        <div className="lg:hidden border-b border-surface-container-highest bg-surface-container-low">
          <div className="px-3 pt-3 pb-2">
            <div className="mobile-h-scroll scroll-hide">{dayIds.map((day) => renderDayPill(day, true))}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 px-3 pb-3 border-t border-outline-variant/60 pt-2">
            <button
              type="button"
              onClick={() => setBalanceOpen(true)}
              className="relative flex flex-col items-center gap-1 rounded-xl bg-error-container/80 py-2 text-on-error-container"
            >
              <Icon name="report" className="text-[18px]" />
              <span className="text-[10px] font-button">Balance</span>
              {balanceIssues.length > 0 && (
                <span className="absolute top-1 right-3 bg-error text-white text-[8px] min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center">
                  {balanceIssues.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAssistOpen(true)}
              className="flex flex-col items-center gap-1 rounded-xl bg-tertiary-container py-2 text-on-tertiary-container"
            >
              <Icon name="assistant" className="text-[18px]" />
              <span className="text-[10px] font-button">Assist</span>
            </button>
            <button
              type="button"
              onClick={shareMenuPlan}
              className="flex flex-col items-center gap-1 rounded-xl border border-outline-variant bg-surface py-2 text-primary"
            >
              <Icon name="ios_share" className="text-[18px]" />
              <span className="text-[10px] font-button">Share</span>
            </button>
          </div>
          <div className="px-3 pb-3">
            <div className="mobile-h-scroll scroll-hide">{dayRows.map((row) => renderDial(row, true))}</div>
          </div>
        </div>

        <div className="lg:hidden p-3 bg-surface-container-low space-y-3">
          <FeaturedMealCard
            row={featured}
            dayLabel={resolveDayName(state, activeDay)}
            onOpen={() => setDetailRowId(featured.id)}
          />
          <div className="mobile-h-scroll scroll-hide pb-1">
            {sideRows.map((row) => (
              <div key={row.id} className="w-[min(78vw,280px)]">
                <MiniMealCard row={row} onOpen={() => setDetailRowId(row.id)} />
              </div>
            ))}
          </div>
          <AiMenuGeneratorCTA onClick={() => setAssistOpen(true)} />
        </div>

        {/* ——— Desktop layout ——— */}
        <div className="hidden lg:flex px-6 py-3 bg-surface-container-low border-b border-surface-container-highest items-center">
          <div className="flex gap-2 overflow-x-auto flex-1 min-w-0 scroll-hide py-1">
            {dayIds.map((day) => renderDayPill(day))}
          </div>
          <div className="flex gap-2 shrink-0 items-center ml-6 pl-6 border-l border-outline-variant">
            <button
              type="button"
              onClick={() => setBalanceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-error-container text-on-error-container rounded-lg font-button text-xs"
            >
              <Icon name="report" className="text-[16px]" />
              Balance Check
              {balanceIssues.length > 0 && (
                <span className="bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  {balanceIssues.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setAssistOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-tertiary-container text-on-tertiary-container rounded-lg font-button text-xs"
            >
              <Icon name="assistant" className="text-[16px]" />
              Menu Assist
            </button>
          </div>
        </div>

        <div className="hidden lg:flex px-6 py-2 border-b border-surface-container-highest items-center gap-3">
          <div className="grid grid-cols-4 gap-2 flex-1">{dayRows.map((row) => renderDial(row))}</div>
          <button
            type="button"
            onClick={shareMenuPlan}
            aria-label="Share full menu plan"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 shrink-0",
              "w-14 h-14 rounded-2xl border border-outline-variant bg-surface",
              "text-primary hover:bg-primary hover:text-on-primary hover:border-primary transition-colors shadow-sm",
            )}
          >
            <Icon name="ios_share" className="text-[20px]" />
            <span className="text-[8px] font-label-caps tracking-wide leading-none">Share</span>
          </button>
        </div>

        <div className="hidden lg:block p-10 bg-surface-container-low relative">
          <div className="absolute inset-0 menu-cards-radial pointer-events-none" />
          <div className="grid grid-cols-12 gap-8 relative z-10">
            <div className="col-span-4 flex flex-col gap-5">
              {sideRows.map((row) => (
                <MiniMealCard key={row.id} row={row} onOpen={() => setDetailRowId(row.id)} />
              ))}
              <AiMenuGeneratorCTA onClick={() => setAssistOpen(true)} />
            </div>
            <div className="col-span-8">
              <FeaturedMealCard
                row={featured}
                dayLabel={resolveDayName(state, activeDay)}
                onOpen={() => setDetailRowId(featured.id)}
              />
            </div>
          </div>
        </div>
      </div>

      <CommercialDialPopup
        open={Boolean(commercialRow)}
        row={commercialRow}
        state={state}
        onClose={() => setCommercialRowId(null)}
        onSave={(updated) => updateMenuRow(updated, true)}
      />
      <MenuDetailModal
        open={Boolean(detailRow)}
        row={detailRow}
        state={state}
        dayLabel={resolveDayName(state, activeDay)}
        onClose={() => setDetailRowId(null)}
        onSave={updateMenuRow}
      />
      <BalanceCheckModal open={balanceOpen} issues={balanceIssues} onClose={() => setBalanceOpen(false)} />
      <MenuAssistModal
        open={assistOpen}
        state={state}
        activeDay={activeDay}
        onClose={() => setAssistOpen(false)}
        onAddItem={handleAddOn}
      />
    </>
  );
}
