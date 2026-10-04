import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccess } from "../hooks/useAccess";
import { useAuth } from "../hooks/useAuth";
import { useWeddingState } from "../hooks/useWeddingState";
import {
  countUnreadActivity,
  dismissActivityItem,
  isActivityItemRead,
  markActivityItemRead,
  visibleActivityItems,
} from "../domain/activity";
import {
  enableWebPush,
  ensureWebPushRegistered,
  getBrowserPushSubscription,
  isPushArmedLocally,
} from "../domain/pushClient";
import {
  getBlockedPushSteps,
  getPushPermission,
  isIosDevice,
  isStandalonePwa,
  type PushPermission,
} from "../domain/pushPermission";
import { activityDeepLink, activityIcon } from "../domain/notificationRoutes";
import { Icon } from "../components/ui/Icon";
import { cn } from "../design-system/cn";
import type { ActivityItem } from "../domain/types";

const SWIPE_REVEAL_PX = 88;
const SWIPE_DISMISS_PX = 96;

function relativeTime(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function typeLabel(type: ActivityItem["type"] | string): string {
  switch (type) {
    case "task.assigned":
    case "task.updated":
      return "Buddies";
    case "buzz.published":
    case "broadcast":
      return "Buzz";
    case "invite.claimed":
      return "Invite";
    default:
      return "Update";
  }
}

/** Banner setup only — no test send. */
function PushSetupCard({
  eventId,
  eventCode,
  showToast,
}: {
  eventId?: string;
  eventCode: string;
  showToast: (message: string) => void;
}) {
  const [permission, setPermission] = useState<PushPermission>(() => getPushPermission());
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmAsk, setConfirmAsk] = useState(false);

  const refresh = async () => {
    const next = getPushPermission();
    setPermission(next);
    if (next !== "granted") {
      setArmed(false);
      return;
    }
    const sub = await getBrowserPushSubscription();
    const locally = isPushArmedLocally(eventCode || eventId || "");
    if (sub && locally) {
      setArmed(true);
      return;
    }
    if (eventCode || eventId) {
      const result = await ensureWebPushRegistered({ eventId, eventCode });
      setArmed(Boolean(result.ok));
    } else {
      setArmed(Boolean(sub));
    }
  };

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventCode, eventId]);

  const steps = useMemo(() => getBlockedPushSteps(), [permission]);
  const needsHomeScreen = isIosDevice() && !isStandalonePwa() && permission !== "granted";

  const runEnable = async () => {
    setBusy(true);
    const result = await enableWebPush({ eventId, eventCode });
    setBusy(false);
    setConfirmAsk(false);
    await refresh();
    if (result.ok) showToast("Phone banners on");
    else if (result.reason === "blocked") showToast("Alerts are blocked on this device");
    else if (result.reason === "dismissed") showToast("You can turn banners on anytime");
    else if (result.reason === "missing_event") showToast("Open an event first");
    else showToast("Could not enable banners");
  };

  if (permission === "granted" && armed) return null;

  if (permission === "unsupported") return null;

  if (permission === "denied") {
    return (
      <section className="rounded-[22px] bg-[#fffdf8] px-3 py-3.5 space-y-3">
        <div>
          <p className="text-[16px] font-semibold text-black">Phone banners blocked</p>
          <p className="mt-1 text-[13px] font-medium text-[#584141] leading-snug">
            Turn notifications on in Settings, then finish here.
          </p>
        </div>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#feca43] text-[11px] font-extrabold text-black">
                {index + 1}
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-black">{step.title}</span>
                <span className="block text-[12px] font-medium text-[#584141] leading-snug">
                  {step.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runEnable()}
          className="h-11 w-full rounded-full bg-[#feca43] text-[15px] font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Checking…" : "I’ve turned them on"}
        </button>
      </section>
    );
  }

  if (permission === "granted" && !armed) {
    return (
      <section className="rounded-[22px] bg-[#fffdf8] px-3 py-3.5 space-y-2.5">
        <p className="text-[16px] font-semibold text-black">Finish phone banners</p>
        <p className="text-[13px] font-medium text-[#584141] leading-snug">
          One tap links this phone so joins can arrive when the app is closed.
        </p>
        <button
          type="button"
          data-testid="push-arm-alerts"
          disabled={busy || (!eventCode && !eventId)}
          onClick={() => void runEnable()}
          className="h-11 w-full rounded-full bg-[#feca43] text-[15px] font-semibold text-black disabled:opacity-50"
        >
          {busy ? "Turning on…" : "Turn on phone banners"}
        </button>
      </section>
    );
  }

  if (confirmAsk) {
    return (
      <section className="rounded-[22px] bg-[#fffdf8] px-3 py-3.5 space-y-2.5">
        <p className="text-[16px] font-semibold text-black">Get banners on this phone?</p>
        <p className="text-[13px] font-medium text-[#584141] leading-snug">
          Your phone will ask next — tap Allow. The list still works either way.
        </p>
        {needsHomeScreen ? (
          <p className="rounded-2xl bg-[#fff8f5] px-3 py-2 text-[12px] font-medium text-[#584141] leading-snug">
            On iPhone, open BiyeFlow from the Home Screen icon first.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setConfirmAsk(false)}
            className="h-11 rounded-full bg-white px-4 text-[15px] font-semibold text-black"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runEnable()}
            className="h-11 rounded-full bg-[#feca43] text-[15px] font-semibold text-black disabled:opacity-50"
          >
            {busy ? "Asking…" : "Continue"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmAsk(true)}
      className="flex w-full items-center gap-3 rounded-[22px] bg-[#fffdf8] px-3 py-3 text-left"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fff8f5] text-[18px]">
        <Icon name="notifications" className="text-[22px] text-[#584141]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-black">Phone banners off</span>
        <span className="block text-[13px] font-medium text-[#584141]">Optional lock-screen alerts</span>
      </span>
      <span className="rounded-full bg-[#feca43] px-3.5 py-2 text-[13px] font-semibold text-black">
        Set up
      </span>
    </button>
  );
}

function SwipeRow({
  item,
  unread,
  onOpen,
  onDismiss,
}: {
  item: ActivityItem;
  unread: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const offsetRef = useRef(0);

  const setOffsetBoth = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  const endDrag = (final: number) => {
    setDragging(false);
    startX.current = null;
    if (final <= -SWIPE_DISMISS_PX) {
      setOffsetBoth(-SWIPE_REVEAL_PX);
      window.setTimeout(onDismiss, 140);
      return;
    }
    if (final <= -SWIPE_REVEAL_PX / 2) {
      setOffsetBoth(-SWIPE_REVEAL_PX);
      return;
    }
    setOffsetBoth(0);
  };

  const onPointerDown = (clientX: number) => {
    startX.current = clientX;
    setDragging(true);
  };

  const onPointerMove = (clientX: number) => {
    if (startX.current == null) return;
    const delta = Math.min(0, clientX - startX.current);
    setOffsetBoth(Math.max(-SWIPE_REVEAL_PX, delta));
  };

  return (
    <li className="relative overflow-hidden border-t border-[#ece7e2] first:border-t-0">
      <button
        type="button"
        aria-label={`Remove ${item.title}`}
        onClick={onDismiss}
        className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-[#424242] text-white"
      >
        <span className="text-[13px] font-semibold">Remove</span>
      </button>
      <div
        className={cn(
          "relative bg-[#fffdf8] touch-pan-y",
          dragging ? "" : "transition-transform duration-200 ease-out",
        )}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={(event) => onPointerDown(event.touches[0]?.clientX ?? 0)}
        onTouchMove={(event) => onPointerMove(event.touches[0]?.clientX ?? 0)}
        onTouchEnd={() => endDrag(offsetRef.current)}
        onTouchCancel={() => endDrag(0)}
        onPointerDown={(event) => {
          if (event.pointerType === "touch") return;
          onPointerDown(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "touch" || startX.current == null) return;
          onPointerMove(event.clientX);
        }}
        onPointerUp={(event) => {
          if (event.pointerType === "touch") return;
          endDrag(offsetRef.current);
        }}
        onPointerCancel={(event) => {
          if (event.pointerType === "touch") return;
          endDrag(0);
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (Math.abs(offsetRef.current) > 8) {
              setOffsetBoth(0);
              return;
            }
            onOpen();
          }}
          className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-[#fff8e8]"
        >
          <span
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-full text-[16px] font-bold",
              unread ? "bg-[#feca43] text-black" : "bg-[#fff8f5] text-[#584141]",
            )}
          >
            <Icon name={activityIcon(item.type)} className="text-[20px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-[16px]",
                unread ? "font-bold text-black" : "font-semibold text-black",
              )}
            >
              {item.title}
            </span>
            <span className="block truncate text-[13px] font-medium text-[#584141]">
              {item.body
                ? `${item.body} · ${relativeTime(item.createdAt)}`
                : `${typeLabel(item.type)} · ${relativeTime(item.createdAt)}`}
            </span>
          </span>
          {unread ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#feca43]"
              aria-label="Unread"
            />
          ) : (
            <Icon name="chevron_right" className="text-[18px] text-[#584141]" />
          )}
        </button>
      </div>
    </li>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, syncCode, showToast, refreshFromCloud, joinWeddingLink } = useWeddingState();
  const { session, enterAsHost, enterAsMember } = useAccess();
  const { memberships, user, status } = useAuth();
  const [openingCode, setOpeningCode] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status === "anon") navigate("/login", { replace: true });
  }, [status, navigate]);

  const eventCode = syncCode || session?.weddingCode || "";
  const membership = memberships.find(
    (m) => m.eventCode.toUpperCase() === eventCode.toUpperCase(),
  );
  const role = session?.role || membership?.role || "guest";
  const guestId =
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("biyeflow.claimGuestId")) ||
    null;

  const items = useMemo(() => {
    if (!eventCode) return [];
    return visibleActivityItems(state.activity || [], eventCode, role, {
      guestId,
      userId: user?.id,
    });
  }, [state.activity, role, guestId, user?.id, eventCode, tick]);

  const unreadCount = eventCode
    ? countUnreadActivity(state.activity || [], eventCode, role, {
        guestId,
        userId: user?.id,
      })
    : 0;
  void tick;
  const insideEvent = Boolean(eventCode);

  useEffect(() => {
    if (!insideEvent || !eventCode) return;
    void refreshFromCloud(true);
  }, [insideEvent, eventCode, refreshFromCloud]);

  const goBack = () => {
    const from = (location.state as { from?: string } | null)?.from;
    if (from) {
      navigate(from);
      return;
    }
    if (insideEvent) navigate(-1);
    else navigate("/dashboard");
  };

  const openItem = (item: ActivityItem) => {
    if (eventCode) {
      markActivityItemRead(eventCode, item.id);
      setTick((n) => n + 1);
    }
    const href = item.href || activityDeepLink(item.type);
    navigate(href);
  };

  const dismissItem = (item: ActivityItem) => {
    if (!eventCode) return;
    dismissActivityItem(eventCode, item.id);
    markActivityItemRead(eventCode, item.id);
    setTick((n) => n + 1);
  };

  const openEventFeed = async (code: string, eventRole: string) => {
    if (openingCode) return;
    setOpeningCode(code);
    try {
      await joinWeddingLink(code);
      if (eventRole === "guest" || eventRole === "buddy") await enterAsMember(code);
      else await enterAsHost(code);
      navigate("/notifications", { replace: true, state: { from: "/dashboard" } });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not open this event");
    } finally {
      setOpeningCode(null);
    }
  };

  const subtitle = insideEvent
    ? membership?.eventName
      ? unreadCount > 0
        ? `${membership.eventName} · ${unreadCount === 1 ? "1 unread" : `${unreadCount} unread`}`
        : `${membership.eventName} · You’re caught up`
      : unreadCount > 0
        ? `${unreadCount === 1 ? "1 unread" : `${unreadCount} unread`}`
        : "You’re caught up"
    : "Each event keeps its own list.";

  return (
    <div className="font-[Manrope,sans-serif] flex min-h-dvh flex-col bg-[#fff8f5] text-black">
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid h-11 w-11 place-items-center rounded-full text-black active:bg-white/70"
        >
          <Icon name="chevron_left" className="text-[24px]" />
        </button>

        <header className="mt-1">
          <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.045em]">
            Notifications
          </h1>
          <p
            className="mt-2 text-[15px] font-medium leading-snug text-[#584141]"
            role="status"
            aria-atomic="true"
          >
            {subtitle}
          </p>
        </header>

        {insideEvent ? (
          <div className="mt-5 flex min-h-0 flex-1 flex-col space-y-4">
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
                <span className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-full bg-[#fffdf8]">
                  <Icon name="notifications" className="text-[36px] text-[#584141]" />
                </span>
                <p className="mt-5 text-[28px] font-extrabold leading-none tracking-[-0.04em] text-black">
                  No updates yet
                </p>
                <p className="mt-3 max-w-[16rem] text-[15px] font-medium leading-snug text-[#584141]">
                  Joins, Buzz, and buddy tasks for this event land here.
                </p>
              </div>
            ) : (
              <section>
                <h2 className="px-1 text-[13px] font-bold tracking-[0.08em] text-[#584141]">
                  THIS EVENT
                </h2>
                <ul className="mt-2 overflow-hidden rounded-[22px] bg-[#fffdf8]">
                  {items.map((item) => (
                    <SwipeRow
                      key={item.id}
                      item={item}
                      unread={!isActivityItemRead(eventCode, item)}
                      onOpen={() => openItem(item)}
                      onDismiss={() => dismissItem(item)}
                    />
                  ))}
                </ul>
                <p className="mt-2 px-1 text-[12px] font-medium text-[#b5a9a4]">
                  Swipe left to remove
                </p>
              </section>
            )}

            <PushSetupCard
              eventId={membership?.eventId}
              eventCode={eventCode}
              showToast={showToast}
            />
          </div>
        ) : (
          <section className="mt-5">
            <h2 className="px-1 text-[13px] font-bold tracking-[0.08em] text-[#584141]">
              YOUR EVENTS
            </h2>
            <ul className="mt-2 overflow-hidden rounded-[22px] bg-[#fffdf8]">
              {memberships.length === 0 ? (
                <li className="px-3 py-8 text-center text-[15px] font-medium text-[#584141]">
                  No events yet.
                </li>
              ) : (
                memberships.map((row) => {
                  const unread =
                    row.eventCode.toUpperCase() === (syncCode || "").toUpperCase()
                      ? countUnreadActivity(state.activity || [], row.eventCode, row.role, {
                          guestId,
                          userId: user?.id,
                        })
                      : 0;
                  return (
                    <li key={row.id} className="border-t border-[#ece7e2] first:border-t-0">
                      <button
                        type="button"
                        disabled={openingCode === row.eventCode}
                        onClick={() => void openEventFeed(row.eventCode, row.role)}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-[#fff8e8]"
                      >
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#feca43] text-[16px] font-bold text-black">
                          {(row.eventName || "E").trim().charAt(0).toUpperCase() || "E"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold text-black">
                            {row.eventName || "Event"}
                          </span>
                          <span className="block text-[13px] font-medium text-[#584141]">
                            {openingCode === row.eventCode ? "Opening…" : "Open updates"}
                          </span>
                        </span>
                        {unread > 0 ? (
                          <span
                            className="min-w-[22px] shrink-0 rounded-full bg-[#feca43] px-1.5 text-center text-[11px] font-extrabold leading-[22px] text-black whitespace-nowrap"
                            role="status"
                            aria-atomic="true"
                          >
                            {unread > 9 ? "9+" : unread}
                          </span>
                        ) : (
                          <Icon name="chevron_right" className="text-[18px] text-[#584141]" />
                        )}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
