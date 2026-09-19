import { Link } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { CommandCenterWidget } from "../components/command-center/CommandCenterWidget";
import { HomeLandingHeader } from "../components/command-center/HomeLandingHeader";
import { HomeInviteProgressCard } from "../components/command-center/HomeInviteProgressCard";
import { HomeLiveCard } from "../components/command-center/HomeLiveCard";
import { Icon } from "../components/ui/Icon";
import {
  buildBuddyOverviewWidget,
  buildCoreOverviewWidgets,
  buildHomeLiveCards,
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
  const liveCards = buildHomeLiveCards(state, snapshot, canManage);
  const buddyWidget = canManage ? buildBuddyOverviewWidget(state, snapshot) : null;
  const menuWidget = coreWidgets.find((w) => w.id === "menu");
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
            "home-page-scroll max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-y-auto max-lg:overflow-x-hidden max-lg:overscroll-contain",
            "max-lg:px-3.5 max-lg:pt-1 max-lg:pb-[calc(5.5rem+env(safe-area-inset-bottom))]",
            "space-y-0 lg:space-y-4 lg:px-0 lg:pb-0 lg:overflow-visible",
          )}
        >
          <section aria-label="Home overview" className="lg:hidden">
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
            <HomeInviteProgressCard guests={state.guests} />
            <div className="mb-1.5 mt-1 flex items-center justify-between">
              <h3 className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-[#7a6f62]">
                Your modules
              </h3>
            </div>
            <div className="home-live-rail" aria-label="Module cards">
              {liveCards.map((card) => (
                <HomeLiveCard key={card.id} card={card} />
              ))}
            </div>

            {!setupComplete ? (
              <section className="home-setup-block mt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[0.9rem] font-extrabold text-[#2c2419]">Getting started</h3>
                  <span className="text-[0.68rem] font-bold tabular-nums text-[#7a6f62]">
                    {progress.done}/{progress.total}
                  </span>
                </div>
                <div className="home-setup-bar">
                  <i style={{ width: `${progress.pct}%` }} />
                </div>
                <div className="home-task-glass">
                  {tasks.map((task) => {
                    const inner = (
                      <>
                        <span className={cn("home-task-check", task.done && "on")}>
                          {task.done ? "✓" : ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[0.84rem] font-extrabold text-[#2c2419]">
                            {task.label}
                          </span>
                          <span className="block text-[0.68rem] font-semibold text-[#7a6f62]">
                            {task.done ? "Done" : task.hint}
                          </span>
                        </span>
                        {task.done ? null : (
                          <Icon name="chevron_right" className="shrink-0 text-[18px] text-[#7a6f62]" />
                        )}
                      </>
                    );

                    if (task.id === "dates") {
                      return (
                        <button
                          key={task.id}
                          type="button"
                          onClick={openScheduleEditor}
                          disabled={!canEdit || task.done}
                          className="home-task"
                        >
                          {inner}
                        </button>
                      );
                    }

                    if (task.done) {
                      return (
                        <div key={task.id} className="home-task">
                          {inner}
                        </div>
                      );
                    }

                    return (
                      <Link key={task.id} to={task.to} className="home-task">
                        {inner}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : menuWidget ? (
              <section className="mt-2">
                <div className="mb-2">
                  <h3 className="text-[0.9rem] font-extrabold text-[#2c2419]">Menu</h3>
                </div>
                <Link to={menuWidget.to} className="home-team-card" aria-label="Open menu">
                  <span className="home-team-card__av">
                    <Icon name="restaurant" className="text-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[0.9rem] font-extrabold text-[#2c2419]">
                        {menuWidget.detail}
                      </span>
                      {menuWidget.status === "attention" ? (
                        <span className="home-team-card__badge">Review</span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.68rem] font-semibold text-[#7a6f62]">
                      {menuWidget.alert || "Tap to plan courses"}
                    </span>
                  </span>
                  <Icon name="chevron_right" className="shrink-0 text-[18px] text-[#7a6f62]" />
                </Link>
              </section>
            ) : null}
          </section>

          <section
            aria-label="Home overview"
            className={cn(
              "hidden lg:flex home-landing-frame bento-card flex-col overflow-hidden bg-white",
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
              <HomeInviteProgressCard guests={state.guests} />
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
                "hidden lg:block bento-card space-y-3 bg-white p-4",
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
                "hidden lg:block bento-card bg-white p-4",
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
