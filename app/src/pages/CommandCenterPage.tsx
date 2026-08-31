import { Link } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { CommandCenterWidget } from "../components/command-center/CommandCenterWidget";
import { HomeLandingHeader } from "../components/command-center/HomeLandingHeader";
import { Icon } from "../components/ui/Icon";
import {
  buildBuddyOverviewWidget,
  buildCoreOverviewWidgets,
  buildSetupTasks,
  setupProgress,
} from "../domain/commandCenterSummary";
import { formatWeddingScheduleHome, weddingScheduleNeedsSetup } from "../domain/functions";
import { cn } from "../design-system/cn";

export function CommandCenterPage() {
  const { state, syncLive, syncCode, setScheduleModalOpen } = useWeddingState();
  const { profile, snapshot, isGuest, canManage, canEdit } = useAccess();

  if (isGuest) {
    return (
      <div className="mx-auto max-w-lg px-3 py-8 text-center space-y-4">
        <Icon name="campaign" className="text-primary text-[40px]" />
        <h1 className="font-headline-md text-primary text-[24px]">Welcome, {profile?.name}</h1>
        <p className="text-[13px] text-secondary">Your wedding hub is BUZZ — welcome, invitation & venue.</p>
        <Link
          to="/buzz"
          className="inline-flex h-11 items-center px-6 rounded-full bg-primary text-on-primary font-button text-[13px]"
        >
          Open BUZZ
        </Link>
      </div>
    );
  }

  const tasks = buildSetupTasks(state, snapshot, canManage);
  const progress = setupProgress(tasks);
  const coreWidgets = buildCoreOverviewWidgets(state, snapshot, canManage);
  const buddyWidget = canManage ? buildBuddyOverviewWidget(state, snapshot) : null;
  const setupComplete = progress.pct >= 100;
  const attentionCount = coreWidgets.filter((w) => w.status === "attention").length;
  const scheduleHome = formatWeddingScheduleHome(state);
  const datesNeedSetup = weddingScheduleNeedsSetup(state);

  const openScheduleEditor = () => {
    if (!canEdit) return;
    setScheduleModalOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col max-lg:mx-0 max-lg:max-w-none max-lg:min-h-0 max-lg:flex-1 lg:py-4">
      <div
        className={cn(
          "max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col",
          "max-lg:overflow-hidden",
        )}
      >
        <div
          className={cn(
            "home-page-scroll max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overscroll-contain",
            "max-lg:px-0 max-lg:pt-0 max-lg:pb-3",
            "space-y-0 lg:space-y-4 lg:px-0 lg:pb-0 lg:overflow-visible",
          )}
        >
          <section
            aria-label="Home overview"
            className={cn(
              "home-landing-frame bento-card flex flex-col overflow-hidden bg-white",
              "max-lg:rounded-none max-lg:border-0 max-lg:shadow-none",
              "lg:mx-auto lg:w-full lg:rounded-2xl lg:border",
            )}
          >
            <HomeLandingHeader
              eventName={state.event.name}
              syncCode={syncCode}
              syncLive={syncLive}
              attentionCount={attentionCount}
              scheduleHome={scheduleHome}
              datesNeedSetup={datesNeedSetup}
              canEdit={canEdit}
              onEditDates={openScheduleEditor}
            />

            <div className="home-glass-stage p-3 pb-3.5 lg:p-4">
              <div className="home-widget-grid grid grid-cols-2 gap-2.5 lg:gap-3">
                {coreWidgets.map((widget) => (
                  <CommandCenterWidget key={widget.id} widget={widget} compact />
                ))}
              </div>
            </div>
          </section>

          {!setupComplete ? (
            <section
              className={cn(
                "bento-card space-y-3 bg-white p-4",
                "max-lg:rounded-none max-lg:border-0 max-lg:border-t max-lg:border-[rgba(128,0,32,0.08)] max-lg:shadow-none",
                "lg:rounded-2xl lg:border lg:border-[rgba(128,0,32,0.12)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-label-caps text-[9px] tracking-[0.14em] text-primary">
                  Getting started
                </p>
                <span className="text-[10px] tabular-nums text-secondary lg:text-[11px]">
                  {progress.done}/{progress.total}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(128,0,32,0.08)]">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <ul className="space-y-1.5">
                {tasks
                  .filter((task) => !task.done)
                  .slice(0, 3)
                  .map((task) => (
                    <li key={task.id}>
                      {task.id === "dates" ? (
                        <button
                          type="button"
                          onClick={openScheduleEditor}
                          disabled={!canEdit}
                          className="flex min-h-10 w-full items-center gap-2.5 rounded-xl border border-[rgba(128,0,32,0.08)] px-3 py-2 text-[11px] text-primary transition-colors hover:bg-[rgba(128,0,32,0.03)] disabled:opacity-50 lg:text-[12px]"
                        >
                          <Icon
                            name="radio_button_unchecked"
                            className="shrink-0 text-[16px] text-secondary"
                          />
                          <span className="min-w-0 flex-1 truncate text-left">{task.label}</span>
                          <Icon name="chevron_right" className="shrink-0 text-[16px] text-secondary/40" />
                        </button>
                      ) : (
                        <Link
                          to={task.to}
                          className="flex min-h-10 items-center gap-2.5 rounded-xl border border-[rgba(128,0,32,0.08)] px-3 py-2 text-[11px] text-primary transition-colors hover:bg-[rgba(128,0,32,0.03)] lg:text-[12px]"
                        >
                          <Icon
                            name="radio_button_unchecked"
                            className="shrink-0 text-[16px] text-secondary"
                          />
                          <span className="min-w-0 flex-1 truncate">{task.label}</span>
                          <Icon name="chevron_right" className="shrink-0 text-[16px] text-secondary/40" />
                        </Link>
                      )}
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          {buddyWidget ? (
            <section
              className={cn(
                "bento-card bg-white p-4",
                "max-lg:rounded-none max-lg:border-0 max-lg:border-t max-lg:border-[rgba(128,0,32,0.08)] max-lg:shadow-none",
                "lg:rounded-2xl lg:border lg:border-[rgba(128,0,32,0.12)]",
              )}
            >
              <p className="mb-2.5 font-label-caps text-[9px] tracking-[0.14em] text-secondary">
                Team
              </p>
              <CommandCenterWidget widget={buddyWidget} />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
