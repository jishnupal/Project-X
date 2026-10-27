import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { HomeLandingHeader } from "../components/command-center/HomeLandingHeader";
import { EventDetailsSheet } from "../components/command-center/EventDetailsSheet";
import { HomeLiveCard } from "../components/command-center/HomeLiveCard";
import { Icon } from "../components/ui/Icon";
import { buildSetupTasks, homeCardPending } from "../domain/commandCenterSummary";
import { formatWeddingScheduleHome, resolveDayName, weddingScheduleNeedsSetup } from "../domain/functions";
import { cn } from "../design-system/cn";
import { useNavigateInsideEvent, useSheetHistory } from "../navigation/eventHistory";

type HomeModuleCard = {
  key: string;
  title: string;
  line: string;
  image: string;
  pending: number;
  liftArt?: boolean;
  to?: string;
  onOpen?: () => void;
};

export function CommandCenterPage() {
  const go = useNavigateInsideEvent();
  const [searchParams, setSearchParams] = useSearchParams();
  const { state, setState, showToast, setScheduleModalOpen, setScheduleFocusId } =
    useWeddingState();
  const { profile, snapshot, isGuest, canManage, canAccessModule } = useAccess();
  const [detailsOpen, setDetailsOpen] = useSheetHistory("plot");

  useEffect(() => {
    const invitesDeep =
      searchParams.get("invites") === "1" || searchParams.get("sheet") === "invites";
    if (!invitesDeep) return;
    const next = new URLSearchParams(searchParams);
    next.delete("invites");
    next.delete("sheet");
    setSearchParams(next, { replace: true });
    go("/people/invites");
  }, [searchParams, setSearchParams, go]);
  const [activeModule, setActiveModule] = useState(0);
  const stackRef = useRef<HTMLDivElement>(null);

  const canViewGuests = canAccessModule("guests", "view");
  const canViewRooms = canAccessModule("rooms", "view");
  const canViewMenu = canAccessModule("menu", "view");
  const canViewBuzz = canAccessModule("buzz", "view");
  const modules = state.modules || { stay: false, menu: false, asked: false };
  const pending = homeCardPending(state);

  const peopleCards = useMemo<HomeModuleCard[]>(() => {
    if (!canViewGuests) return [];
    return [
      {
        key: "invitations",
        title: "Invitations",
        line: pending.invitations ? "Still to send" : "Send passes",
        image: "/home/home-invitations.png",
        pending: pending.invitations,
        to: "/people/invites",
      },
      {
        key: "contacts",
        title: "Contacts",
        line: pending.contacts ? "Add guests" : "Guest list",
        image: "/home/home-guests.png",
        pending: pending.contacts,
        to: "/people/contacts",
      },
    ];
  }, [canViewGuests, pending.invitations, pending.contacts]);

  const stackCards = useMemo<HomeModuleCard[]>(() => {
    const cards: HomeModuleCard[] = [];
    if (canViewBuzz) {
      cards.push({
        key: "buzz",
        title: "Buzz",
        line: pending.buzz ? "Finish the invite" : "Games & board",
        image: "/home/home-buzz.png",
        pending: pending.buzz,
        to: "/buzz",
      });
    }
    if (canViewRooms && modules.stay) {
      cards.push({
        key: "stay",
        title: "Stay",
        line: pending.stay ? "Rooms open" : "Guest rooms",
        image: "/home/home-stay.png",
        pending: pending.stay,
        to: "/people/rooms",
      });
    }
    if (canViewMenu && modules.menu) {
      cards.push({
        key: "menu",
        title: "Menu",
        line: pending.menu ? "Meals open" : "Food plan",
        image: "/home/home-menu.png",
        liftArt: true,
        pending: pending.menu,
        to: "/people/menu",
      });
    }
    return cards;
  }, [
    canViewBuzz,
    canViewRooms,
    canViewMenu,
    modules.stay,
    modules.menu,
    pending.buzz,
    pending.stay,
    pending.menu,
  ]);

  const stackCount = stackCards.length;

  useEffect(() => {
    const track = stackRef.current;
    if (!track || stackCount === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = () => {
      const cards = Array.from(track.querySelectorAll<HTMLElement>("[data-home-stack-card]"));
      if (!cards.length) return;

      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;

      cards.forEach((card, i) => {
        const c = card.offsetLeft + card.offsetWidth / 2;
        const dist = (c - mid) / (card.offsetWidth * 0.72);
        const x = Math.max(-2.2, Math.min(2.2, dist));
        const abs = Math.abs(x);
        const centered = abs < 0.35;

        if (centered || reduce) {
          // Focused card = same optical sharpness as People pins (no tilt/blur)
          card.style.setProperty("--ry", "0deg");
          card.style.setProperty("--sc", reduce && !centered ? "0.9" : "1");
          card.style.setProperty("--tx", "0px");
          card.style.setProperty("--op", reduce && !centered ? "0.7" : "1");
        } else {
          card.style.setProperty("--ry", `${(-x * 18).toFixed(2)}deg`);
          card.style.setProperty("--sc", String((1 - Math.min(abs * 0.12, 0.16)).toFixed(3)));
          card.style.setProperty("--tx", `${(x * -8).toFixed(1)}px`);
          card.style.setProperty("--op", String((1 - Math.min(abs * 0.28, 0.42)).toFixed(3)));
        }

        card.style.removeProperty("--blur");
        card.style.filter = "";
        card.style.zIndex = String(Math.round(20 - abs * 8));
        card.classList.toggle("is-center", centered);

        if (abs < bestDist) {
          bestDist = abs;
          best = i;
        }
      });

      setActiveModule(best);
    };

    const onScroll = () => requestAnimationFrame(paint);
    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", paint);

    requestAnimationFrame(() => {
      const first = track.querySelector<HTMLElement>("[data-home-stack-card]");
      if (first) {
        track.scrollLeft = first.offsetLeft - (track.clientWidth - first.offsetWidth) / 2;
      }
      paint();
    });

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", paint);
    };
  }, [stackCount]);

  if (isGuest) {
    return (
      <div className="mx-auto max-w-lg px-3 py-8 text-center space-y-4">
        <Icon name="campaign" className="text-primary text-[40px]" />
        <h1 className="font-headline-md text-primary text-[24px]">Welcome, {profile?.name}</h1>
        <p className="text-[13px] text-secondary">Your event hub is BUZZ — welcome, invitation & venue.</p>
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
  const openTasks = tasks.filter((task) => !task.done);
  const scheduleHome = formatWeddingScheduleHome(state);
  const datesNeedSetup = weddingScheduleNeedsSetup(state);
  const showModuleAsk = canManage && !modules.asked && !modules.stay && !modules.menu;

  const openScheduleEditor = (focusId?: number) => {
    setScheduleFocusId(focusId ?? null);
    setScheduleModalOpen(true);
  };

  const setModules = (next: { stay?: boolean; menu?: boolean; asked?: boolean }) => {
    setState((prev) => ({
      ...prev,
      modules: {
        stay: next.stay ?? Boolean(prev.modules?.stay),
        menu: next.menu ?? Boolean(prev.modules?.menu),
        asked: next.asked ?? Boolean(prev.modules?.asked),
      },
    }));
  };

  const next = openTasks[0];
  const command =
    next?.id === "dates"
      ? "Lock the days first."
      : next?.id === "buzz"
        ? "Write the invite next."
        : next?.id === "guests"
          ? "Add the people next."
          : next?.id === "menu"
            ? "Set the food next."
            : "You're set. Open a card.";

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
            "max-lg:px-3.5 max-lg:pt-1 max-lg:pb-[calc(4.75rem+env(safe-area-inset-bottom))]",
            "space-y-0 lg:space-y-4 lg:px-0 lg:pb-0 lg:overflow-visible",
          )}
        >
          <section aria-label="Home overview" className="font-[Manrope,sans-serif] text-black">
            <HomeLandingHeader
              eventName={state.event.name}
              command={command}
              scheduleHome={scheduleHome}
              datesNeedSetup={datesNeedSetup}
              onOpenDates={() => openScheduleEditor()}
              onOpenDetails={() => setDetailsOpen(true)}
            />

            <div className="mt-6">
              {peopleCards.length > 0 ? (
                <div className="home-people" data-testid="home-people-pins">
                  <h3 className="home-people__label">People</h3>
                  <div className="home-people-grid" aria-label="People cards">
                    {peopleCards.map((card) => (
                      <HomeLiveCard
                        key={card.key}
                        layout="pin"
                        title={card.title}
                        line={card.line}
                        image={card.image}
                        pending={card.pending}
                        to={card.to}
                        onOpen={card.onOpen}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {stackCount > 0 ? (
                <div className={peopleCards.length > 0 ? "mt-7" : undefined}>
                  <h3 className="px-2 text-[15px] font-medium text-[#584141]">Modules</h3>
                  <div className="home-modules-stack-stage">
                    <div
                      ref={stackRef}
                      className="home-modules-stack"
                      aria-label="Module cards"
                      data-testid="home-module-stack"
                    >
                      {stackCards.map((card) => (
                        <HomeLiveCard
                          key={card.key}
                          layout="stack"
                          title={card.title}
                          line={card.line}
                          image={card.image}
                          pending={card.pending}
                          liftArt={card.liftArt}
                          to={card.to}
                          onOpen={card.onOpen}
                        />
                      ))}
                    </div>
                  </div>

                  {stackCount > 1 ? (
                    <div
                      className="home-modules-dots"
                      role="presentation"
                      aria-hidden
                      data-testid="home-module-dots"
                    >
                      {stackCards.map((card, index) => (
                        <span
                          key={card.key}
                          className={cn(
                            "home-modules-dot",
                            index === activeModule && "is-active",
                          )}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {showModuleAsk ? (
                <div className="mx-2 mt-3 rounded-[24px] bg-white/90 px-4 py-4 shadow-[0_10px_28px_rgba(30,27,24,0.06)]">
                  <p className="text-[15px] font-extrabold tracking-[-0.02em] text-black">
                    Do you need Stay or Menu for this event?
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#584141]">
                    Most hosts start with invites and Buzz. Add rooms or food only if you&apos;re running them here.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setModules({ stay: true, asked: true });
                        showToast("Stay is on Home");
                      }}
                      className="h-10 rounded-full bg-[#feca43] px-4 text-[13px] font-bold text-black"
                    >
                      Yes, Stay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModules({ menu: true, asked: true });
                        showToast("Menu is on Home");
                      }}
                      className="h-10 rounded-full bg-[#feca43] px-4 text-[13px] font-bold text-black"
                    >
                      Yes, Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModules({ stay: true, menu: true, asked: true });
                        showToast("Stay & Menu are on Home");
                      }}
                      className="h-10 rounded-full bg-[#1a100c] px-4 text-[13px] font-bold text-white"
                    >
                      Both
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModules({ stay: false, menu: false, asked: true });
                        showToast("Kept Home light");
                      }}
                      className="h-10 rounded-full px-3 text-[13px] font-semibold text-[#584141]"
                    >
                      Not this event
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <EventDetailsSheet
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        eventName={state.event.name?.trim() || "Your event"}
        dateLine={datesNeedSetup ? "" : scheduleHome.headline}
        functions={state.functions}
        nameOf={(fn) => fn.name || resolveDayName(state, fn.id)}
        state={state}
        onChangeState={setState}
        onOpenDates={() => openScheduleEditor()}
      />
    </div>
  );
}
