import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  isGrandMealCourse,
  menuBalanceSuggestions,
  menuFeaturedRow,
  menuSideRows,
  resolveGrandMealCourse,
} from "../../domain/menu";
import {
  menuCommercialEstimate,
  menuCommercialPlateCount,
} from "../../domain/menuDisplay";
import type { GrandMealCourse, MenuCourse, MenuRow } from "../../domain/types";
import { useWeddingState } from "../../hooks/useWeddingState";
import { useAccess } from "../../hooks/useAccess";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";
import { CommercialDial } from "./CommercialDial";
import { CommercialDialPopup } from "./CommercialDialPopup";
import { FeaturedMealCard } from "./FeaturedMealCard";
import { GrandMealSwitcher } from "./GrandMealSwitcher";
import { MiniMealCard, AiMenuGeneratorCTA } from "./MiniMealCard";
import { MenuDetailModal } from "./MenuDetailModal";
import { BalanceCheckModal } from "./BalanceCheckModal";
import { MenuAssistModal } from "./MenuAssistModal";
import { DayPill } from "./DayPill";
// MobileEventButtons removed — Menu uses DayPill for event selection
import { ViewerBanner } from "../access/ViewerBanner";

export function MenuBoard() {
  const {
    state,
    setState,
    showToast,
    lastCreatedFunctionId,
    clearLastCreatedFunctionId,
  } = useWeddingState();
  const { canAccessModule } = useAccess();
  const canEdit = canAccessModule("menu", "edit");
  const [searchParams] = useSearchParams();
  const dayIds = useMemo(() => functionIds(state), [state]);
  const receptionDayId = state.functions.find((fn) => /reception/i.test(fn.name))?.id;
  const userPickedDay = useRef(false);
  const [activeDay, setActiveDay] = useState(() => {
    const urlDay = Number(searchParams.get("day"));
    if (urlDay && Number.isFinite(urlDay)) {
      userPickedDay.current = true;
      return urlDay;
    }
    return receptionDayId ?? dayIds[1] ?? dayIds[0] ?? 2;
  });
  const [detailRowId, setDetailRowId] = useState<string | null>(null);
  const [commercialRowId, setCommercialRowId] = useState<string | null>(null);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);
  const [swapTo, setSwapTo] = useState<GrandMealCourse | null>(null);
  const swapTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
    };
  }, []);
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
    if (userPickedDay.current || receptionDayId == null) return;
    if (activeDay !== receptionDayId) setActiveDay(receptionDayId);
  }, [receptionDayId, activeDay]);

  useEffect(() => {
    if (lastCreatedFunctionId && dayIds.includes(lastCreatedFunctionId)) {
      userPickedDay.current = true;
      setActiveDay(lastCreatedFunctionId);
      clearLastCreatedFunctionId();
    }
  }, [lastCreatedFunctionId, dayIds, clearLastCreatedFunctionId]);

  const dayRows = useMemo(
    () => MENU_COURSES.map((course) => getMenuRow(state, activeDay, course)),
    [state, activeDay],
  );
  const grandCourse = useMemo(
    () => resolveGrandMealCourse(dayRows, state.grandMealByDay?.[String(activeDay)]),
    [dayRows, state.grandMealByDay, activeDay],
  );
  const featured = useMemo(
    () => menuFeaturedRow(dayRows, grandCourse),
    [dayRows, grandCourse],
  );
  const sideRows = useMemo(() => menuSideRows(dayRows, featured.id), [dayRows, featured.id]);

  const setGrandCourse = (course: GrandMealCourse) => {
    if (!canEdit) {
      showToast("Viewer profiles cannot edit the menu");
      return;
    }
    if (course === grandCourse) return;
    setSwapTo(course);
    if (swapTimer.current) window.clearTimeout(swapTimer.current);
    swapTimer.current = window.setTimeout(() => setSwapTo(null), 720);
    setState((prev) => ({
      ...prev,
      grandMealByDay: { ...(prev.grandMealByDay || {}), [String(activeDay)]: course },
    }));
  };

  const handleDeleteDay = (dayId: number) => {
    if (!canEdit) {
      showToast("Viewer profiles cannot edit the menu");
      return;
    }
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
    if (!canEdit) {
      showToast("Viewer profiles cannot edit the menu");
      return;
    }
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
    userPickedDay.current = true;
    setActiveDay(day);
    showToast("Item added to menu");
  };

  const renderDayPill = (day: number, compact = false) => (
    <DayPill
      key={day}
      isActive={activeDay === day}
      name={resolveDayName(state, day)}
      dateLabel={resolveFunctionDateLabel(state, day)}
      canDelete={canEdit && canRemoveWeddingFunction(state, day)}
      isRemoving={removingDayId === day}
      compact={compact}
      onSelect={() => {
        userPickedDay.current = true;
        setActiveDay(day);
      }}
      onDelete={() => handleDeleteDay(day)}
    />
  );

  const renderDial = (row: MenuRow, compact = false, clay = false) => (
    <CommercialDial
      key={row.id}
      row={row}
      plates={menuCommercialPlateCount(state, row)}
      estimate={menuCommercialEstimate(state, row)}
      compact={compact}
      surface={clay ? "clay" : "default"}
      onClick={() => setCommercialRowId(row.id)}
    />
  );

  const renderMini = (row: MenuRow, clay = false) => (
    <MiniMealCard
      row={row}
      onOpen={() => setDetailRowId(row.id)}
      onMakeGrand={
        isGrandMealCourse(row.course)
          ? () => setGrandCourse(row.course as GrandMealCourse)
          : undefined
      }
      swapping={Boolean(swapTo) && isGrandMealCourse(row.course)}
      surface={clay ? "clay" : "default"}
    />
  );

  return (
    <>
      <div className="bento-card mobile-card rounded-2xl lg:rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 lg:h-full max-lg:rounded-none max-lg:border-0 max-lg:shadow-none max-lg:bg-transparent">
        <ViewerBanner module="menu" className="mx-3 mt-2 lg:mx-4 lg:mt-4 shrink-0" />
        {!dayIds.length ? (
          <div className="p-8 text-center space-y-4">
            <Icon name="restaurant_menu" className="text-primary text-[40px]" />
            <h2 className="font-headline-md text-primary text-[22px]">No events yet</h2>
            <p className="text-[13px] text-secondary max-w-sm mx-auto">
              {canEdit
                ? "Add an event day with New Event, then plan courses for each day."
                : "Menu planning will appear here once your Admin adds events."}
            </p>
          </div>
        ) : (
          <>
        <div className="lg:hidden flex flex-col flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <Link
            to="/people/guests"
            className="mb-1 inline-flex items-center gap-1 py-1 text-[0.78rem] font-extrabold text-[#ff6a1a]"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            Back to Guests
          </Link>

          <div className="clay-menu-board">
            <div className="clay-menu-board__head">
              <div className="clay-menu-utils">
                {canEdit ? (
                  <button type="button" className="is-assist" onClick={() => setAssistOpen(true)}>
                    <Icon name="assistant" className="text-[15px]" />
                    Assist
                  </button>
                ) : (
                  <button type="button" disabled>
                    <Icon name="visibility" className="text-[15px]" />
                    View
                  </button>
                )}
                <button type="button" onClick={shareMenuPlan}>
                  <Icon name="ios_share" className="text-[15px]" />
                  Share
                </button>
              </div>
              <GrandMealSwitcher
                value={grandCourse}
                onChange={setGrandCourse}
                swapping={Boolean(swapTo)}
                tone="ink"
              />
            </div>

            <FeaturedMealCard
              key={featured.id}
              row={featured}
              dayLabel={resolveDayName(state, activeDay)}
              onOpen={() => setDetailRowId(featured.id)}
              grandCourse={grandCourse}
              onGrandCourseChange={setGrandCourse}
              swapTo={swapTo}
              surface="clay"
            />

            <div className="clay-menu-sep" />
            <p className="clay-menu-label">Headcount · plates</p>
            <div className="clay-dial-grid">
              {dayRows.map((row) => renderDial(row, true, true))}
            </div>

            <div className="clay-menu-sep" />
            <p className="clay-menu-label">Other courses</p>
            <div className="clay-menu-courses">
              {sideRows.map((row) => (
                <div key={row.id}>{renderMini(row, true)}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex px-5 py-2 bg-surface-container-low border-b border-surface-container-highest items-center shrink-0">
          <div className="flex gap-2 items-center min-w-0 overflow-x-auto scroll-hide py-1">
            {dayIds.map((day) => renderDayPill(day, true))}
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
            {canEdit ? (
              <button
                type="button"
                onClick={() => setAssistOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-tertiary-container text-on-tertiary-container rounded-lg font-button text-xs"
              >
                <Icon name="assistant" className="text-[16px]" />
                Menu Assist
              </button>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:flex px-5 py-1.5 border-b border-surface-container-highest items-center gap-3 shrink-0">
          <div className="grid grid-cols-4 gap-2 flex-1">
            {dayRows.map((row) => renderDial(row))}
          </div>
          <button
            type="button"
            onClick={shareMenuPlan}
            aria-label="Share full menu plan"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 shrink-0",
              "w-12 h-12 rounded-xl border border-outline-variant bg-surface",
              "text-primary hover:bg-primary hover:text-on-primary hover:border-primary transition-colors shadow-sm",
            )}
          >
            <Icon name="ios_share" className="text-[20px]" />
            <span className="text-[8px] font-label-caps tracking-wide leading-none">Share</span>
          </button>
        </div>

        <div className="hidden lg:flex flex-1 min-h-0 p-4 xl:p-5 bg-surface-container-low relative">
          <div className="absolute inset-0 menu-cards-radial pointer-events-none" />
          <div className="grid grid-cols-12 gap-4 xl:gap-5 relative z-10 min-h-0 h-full w-full">
            <div className="col-span-4 flex flex-col gap-3 min-h-0 overflow-hidden">
              {sideRows.map((row) => (
                <div key={row.id} className="min-h-0 flex">
                  {renderMini(row)}
                </div>
              ))}
              {canEdit ? <AiMenuGeneratorCTA onClick={() => setAssistOpen(true)} /> : null}
            </div>
            <div className="col-span-8 min-h-0 h-full">
              <FeaturedMealCard
                key={featured.id}
                row={featured}
                dayLabel={resolveDayName(state, activeDay)}
                onOpen={() => setDetailRowId(featured.id)}
                grandCourse={grandCourse}
                onGrandCourseChange={setGrandCourse}
                swapTo={swapTo}
              />
            </div>
          </div>
        </div>
          </>
        )}
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
      <BalanceCheckModal
        open={balanceOpen}
        issues={balanceIssues}
        onClose={() => setBalanceOpen(false)}
      />
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
