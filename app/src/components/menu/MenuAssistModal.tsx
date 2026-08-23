import { useMemo, useState } from "react";
import { MENU_ADD_ON_ITEMS } from "../../domain/defaults";
import { functionIds, resolveDayName, resolveFunctionDateLabel } from "../../domain/functions";
import {
  MENU_COURSES,
  addOnCategoryDefaultCourse,
  getMenuRow,
  menuItemsForAssistCategory,
} from "../../domain/menu";
import type { MenuCategory, MenuCourse, WeddingState } from "../../domain/types";
import { MENU_ADD_ON_CATEGORIES } from "./menuAssistConstants";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

type MenuAssistModalProps = {
  open: boolean;
  state: WeddingState;
  activeDay: number;
  onClose: () => void;
  onAddItem: (addOnId: string, day: number, course: MenuCourse) => void;
};

export function MenuAssistModal({
  open,
  state,
  activeDay,
  onClose,
  onAddItem,
}: MenuAssistModalProps) {
  const [category, setCategory] = useState<MenuCategory>("Appetizers");
  const [search, setSearch] = useState("");
  const [targetDay, setTargetDay] = useState<number | "">("");
  const [targetCourse, setTargetCourse] = useState<MenuCourse | "">("");

  const dayIds = useMemo(() => functionIds(state), [state]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MENU_ADD_ON_ITEMS.filter((addOn) => {
      const matchesCategory =
        addOn.category === category ||
        (category === "Live Counter" && addOn.category === "Live Counter");
      const haystack = `${addOn.name} ${addOn.category}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [category, search]);

  const targetReady = targetDay !== "" && targetCourse !== "";
  const targetRow =
    targetReady ? getMenuRow(state, targetDay, targetCourse) : null;
  const targetItems = targetRow ? menuItemsForAssistCategory(targetRow, category) : [];

  const addToTarget = (addOnId: string) => {
    if (!targetReady) return;
    onAddItem(addOnId, targetDay, targetCourse);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal
      aria-labelledby="assist-modal-title"
    >
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <div>
            <h3 id="assist-modal-title" className="font-headline-md text-primary">
              Menu Assist
            </h3>
            <p className="text-sm text-on-surface-variant">
              Add-on library • viewing {resolveDayName(state, activeDay)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-secondary">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-4 border-b border-outline-variant flex flex-wrap gap-2">
          {MENU_ADD_ON_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-button border",
                category === cat
                  ? "bg-primary text-on-primary border-primary"
                  : "border-outline-variant text-secondary",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="p-4 border-b border-outline-variant">
          <input
            className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-white"
            placeholder="Search add-ons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-label-caps text-label-caps text-primary mb-2">Add-on ideas</h4>
            {filtered.length ? (
              filtered.map((addOn) => (
                <article
                  key={addOn.id}
                  className="p-3 rounded-xl border border-outline-variant bg-white"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <strong className="text-sm text-on-surface">{addOn.name}</strong>
                      <p className="text-xs text-secondary">{addOn.category}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!targetReady}
                      onClick={() => addToTarget(addOn.id)}
                      className={cn(
                        "text-xs px-2 py-1 rounded-full font-button",
                        targetReady
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container text-secondary cursor-not-allowed",
                      )}
                    >
                      Add
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-secondary">No matching add-on items.</p>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps text-primary">Drop target</h4>
            <article
              className={cn(
                "p-4 rounded-xl border-2 border-dashed min-h-[180px] flex flex-col",
                targetReady
                  ? "border-primary/40 bg-primary/5"
                  : "border-outline-variant bg-surface-container-low",
              )}
            >
              {!targetReady ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <Icon name="touch_app" className="text-secondary text-[32px] mb-2" />
                  <p className="text-sm text-on-surface-variant font-medium">
                    Choose an event and meal below
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    Then add items from the library into that slot
                  </p>
                </div>
              ) : (
                <p className="text-xs text-primary font-button mb-3">
                  Adding to {resolveDayName(state, targetDay)} • {targetCourse}
                </p>
              )}

              <label className="block text-xs text-secondary mb-2">
                Event
                <select
                  className="mt-1 w-full border border-outline-variant rounded-lg px-2 py-2 text-sm bg-white"
                  value={targetDay}
                  onChange={(e) => {
                    const value = e.target.value;
                    setTargetDay(value ? Number(value) : "");
                    setTargetCourse("");
                  }}
                >
                  <option value="">Choose event…</option>
                  {dayIds.map((day) => (
                    <option key={day} value={day}>
                      {resolveDayName(state, day)} ({resolveFunctionDateLabel(state, day) || "—"})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs text-secondary">
                Meal
                <select
                  className="mt-1 w-full border border-outline-variant rounded-lg px-2 py-2 text-sm bg-white disabled:opacity-50"
                  value={targetCourse}
                  disabled={targetDay === ""}
                  onChange={(e) =>
                    setTargetCourse((e.target.value || "") as MenuCourse | "")
                  }
                >
                  <option value="">Choose meal…</option>
                  {MENU_COURSES.map((course) => (
                    <option key={course} value={course}>
                      {course === "Evening Snacks" ? "Snacks" : course}
                    </option>
                  ))}
                </select>
              </label>

              {targetReady && (
                <>
                  <p className="text-xs text-on-surface-variant mt-3">
                    Current {category}: {targetItems.length ? targetItems.join(" | ") : "None yet"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {filtered.slice(0, 4).map((addOn) => (
                      <button
                        key={addOn.id}
                        type="button"
                        onClick={() => addToTarget(addOn.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container"
                      >
                        + {addOn.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </article>

            <button
              type="button"
              className="text-xs text-secondary underline"
              onClick={() => {
                setTargetDay(activeDay);
                setTargetCourse(addOnCategoryDefaultCourse(category));
              }}
            >
              Use current board day ({resolveDayName(state, activeDay)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
