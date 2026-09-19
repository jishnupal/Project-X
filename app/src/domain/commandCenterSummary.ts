import type { AccessSnapshot } from "./access/types";
import { DEFAULT_BUZZ } from "./defaults";
import { guestMetrics } from "./guest";
import { menuItemsArray } from "./menu";
import { buildSetupTasks, setupProgress } from "./onboardingProgress";
import { roomMetrics } from "./rooms";
import type { WeddingState } from "./types";

export type WidgetStatus = "ok" | "attention" | "empty";

export type CommandCenterWidgetData = {
  id: string;
  title: string;
  icon: string;
  to: string;
  status: WidgetStatus;
  value: string;
  detail: string;
  alert?: string;
};

function buzzReady(state: WeddingState): boolean {
  const buzz = { ...DEFAULT_BUZZ, ...state.buzz };
  return (
    Boolean(buzz.welcomeTitle?.trim()) &&
    Boolean(buzz.welcomeMessage?.trim()) &&
    Boolean(buzz.venueName?.trim())
  );
}

function guestAlerts(guests: WeddingState["guests"]) {
  let partialGroup = 0;
  let ungrouped = 0;
  for (const row of guests) {
    if (!row.groupId) {
      ungrouped += 1;
      continue;
    }
    const total = Math.max(1, Number.parseInt(String(row.count || "0"), 10) || 0);
    const inGroup = Number.parseInt(String(row.groupCount || "0"), 10) || 0;
    if (inGroup > 0 && inGroup < total) partialGroup += 1;
  }
  const pendingInvites = guests.filter((row) => !row.invitationSent).length;
  return { partialGroup, ungrouped, pendingInvites };
}

function menuAlerts(menu: WeddingState["menu"]) {
  const emptyCourses = menu.filter((row) => menuItemsArray(row).length === 0).length;
  const inDiscussion = menu.filter((row) => row.status !== "Confirmed").length;
  const days = new Set(menu.map((row) => row.day)).size;
  return { emptyCourses, inDiscussion, days, courseCount: menu.length };
}

export function buildCommandCenterWidgets(
  state: WeddingState,
  snapshot: AccessSnapshot | null,
  canManage: boolean,
): CommandCenterWidgetData[] {
  const guests = state.guests || [];
  const metrics = guestMetrics(guests);
  const guestIssues = guestAlerts(guests);
  const menuStats = menuAlerts(state.menu || []);
  const groups = state.guestGroups?.length || 0;
  const buzzOk = buzzReady(state);

  const widgets: CommandCenterWidgetData[] = [];

  // Guests
  if (guests.length === 0) {
    widgets.push({
      id: "guests",
      title: "Guests",
      icon: "groups",
      to: "/people/guests",
      status: "empty",
      value: "—",
      detail: "No families yet",
      alert: "Add your guest list",
    });
  } else {
    const alerts: string[] = [];
    if (guestIssues.pendingInvites > 0) {
      alerts.push(`${guestIssues.pendingInvites} invite${guestIssues.pendingInvites === 1 ? "" : "s"} pending`);
    }
    if (guestIssues.ungrouped > 0 && groups > 0) {
      alerts.push(`${guestIssues.ungrouped} not in a group`);
    }
    if (guestIssues.partialGroup > 0) {
      alerts.push(`${guestIssues.partialGroup} partial group count`);
    }
    widgets.push({
      id: "guests",
      title: "Guests",
      icon: "groups",
      to: "/people/guests",
      status: alerts.length ? "attention" : "ok",
      value: String(metrics.headTotal),
      detail: `${metrics.familyCount} fam · ${metrics.inviteSentTotal} sent`,
      alert: alerts[0],
    });
  }

  // Stay / rooms
  if (metrics.stayTotal === 0 && guests.length > 0) {
    widgets.push({
      id: "stay",
      title: "Stay",
      icon: "hotel",
      to: "/people/rooms",
      status: "ok",
      value: "0",
      detail: "No stay needed",
    });
  } else if (metrics.stayTotal === 0) {
    widgets.push({
      id: "stay",
      title: "Stay",
      icon: "hotel",
      to: "/people/rooms",
      status: "empty",
      value: "—",
      detail: "Room mapping",
      alert: "Set up after guests",
    });
  } else {
    const rm = roomMetrics(state);
    const allAssigned = rm.unassignedGuests === 0 && rm.totalRooms > 0;
    widgets.push({
      id: "stay",
      title: "Stay",
      icon: "hotel",
      to: "/people/rooms",
      status: allAssigned ? "ok" : "attention",
      value: String(metrics.stayTotal),
      detail: rm.totalRooms > 0
        ? `${rm.occupiedRooms}/${rm.totalRooms} rooms · ${rm.assignedGuests} mapped`
        : "Need rooms",
      alert: allAssigned ? undefined : rm.totalRooms > 0
        ? `${rm.unassignedGuests} unmapped`
        : "Tap to map",
    });
  }

  // Menu
  if (menuStats.courseCount === 0) {
    widgets.push({
      id: "menu",
      title: "Menu",
      icon: "restaurant_menu",
      to: "/people/menu",
      status: "empty",
      value: "—",
      detail: "No courses planned",
      alert: "Plan meals per function",
    });
  } else {
    const alerts: string[] = [];
    if (menuStats.emptyCourses > 0) {
      alerts.push(`${menuStats.emptyCourses} empty`);
    }
    if (menuStats.inDiscussion > 0) {
      alerts.push(`${menuStats.inDiscussion} discussing`);
    }
    widgets.push({
      id: "menu",
      title: "Menu",
      icon: "restaurant_menu",
      to: "/people/menu",
      status: alerts.length ? "attention" : "ok",
      value: String(menuStats.days),
      detail: `${menuStats.courseCount} courses · ${menuStats.days}d`,
      alert: alerts[0],
    });
  }

  // Buzz
  widgets.push({
    id: "buzz",
    title: "Buzz",
    icon: "campaign",
    to: "/buzz",
    status: buzzOk ? "ok" : "attention",
    value: buzzOk ? "Ready" : "Draft",
    detail: buzzOk ? "Welcome & venue" : "Finish content",
    alert: buzzOk ? undefined : "Welcome & venue",
  });

  if (canManage) {
    const buddyCount = (snapshot?.profiles || []).filter((p) => p.role === "buddy").length;
    const guestLink = Boolean(snapshot?.guestInviteToken);
    widgets.push({
      id: "buddies",
      title: "Buddies",
      icon: "handshake",
      to: "/buddies",
      status: !guestLink ? "attention" : buddyCount === 0 ? "empty" : "ok",
      value: String(buddyCount),
      detail: buddyCount === 1 ? "1 helper" : `${buddyCount} helpers`,
      alert: !guestLink ? "Share guest invite link" : buddyCount === 0 ? "Optional — invite helpers" : undefined,
    });
  }

  return widgets;
}

/** Core 2×2 overview — Guests, Stay, Menu, Buzz. */
export function buildCoreOverviewWidgets(
  state: WeddingState,
  snapshot: AccessSnapshot | null,
  canManage: boolean,
): CommandCenterWidgetData[] {
  return buildCommandCenterWidgets(state, snapshot, canManage).filter((w) =>
    ["guests", "stay", "menu", "buzz"].includes(w.id),
  );
}

export function buildBuddyOverviewWidget(
  state: WeddingState,
  snapshot: AccessSnapshot | null,
): CommandCenterWidgetData | null {
  void state;
  const buddyCount = (snapshot?.profiles || []).filter((p) => p.role === "buddy").length;
  const guestLink = Boolean(snapshot?.guestInviteToken);
  return {
    id: "buddies",
    title: "Buddies",
    icon: "handshake",
    to: "/buddies",
    status: !guestLink ? "attention" : buddyCount === 0 ? "empty" : "ok",
    value: String(buddyCount),
    detail: buddyCount === 1 ? "1 helper" : `${buddyCount} helpers`,
    alert: !guestLink ? "Share guest invite link" : buddyCount === 0 ? "Optional — invite helpers" : undefined,
  };
}

export type HomeLiveTagTone = "ok" | "review" | "setup";

export type HomeLiveCardData = {
  id: "guests" | "stay" | "buzz" | "buddies";
  to: string;
  title: string;
  icon: string;
  tag: string;
  tagTone: HomeLiveTagTone;
  needsAction: boolean;
  isOk: boolean;
  actionLine: string;
  headline: string;
  meta: string[];
  cta: string;
  parkChrome?: boolean;
};

function liveTone(status: WidgetStatus): {
  tag: string;
  tagTone: HomeLiveTagTone;
  needsAction: boolean;
  isOk: boolean;
  cta: string;
} {
  if (status === "ok") {
    return { tag: "Ready", tagTone: "ok", needsAction: false, isOk: true, cta: "View" };
  }
  if (status === "attention") {
    return { tag: "Review", tagTone: "review", needsAction: true, isOk: false, cta: "Open" };
  }
  return { tag: "Setup", tagTone: "setup", needsAction: true, isOk: false, cta: "Open" };
}

/** Moodboard live-rail: Guests, Stay, Buzz, Buddies. */
export function buildHomeLiveCards(
  state: WeddingState,
  snapshot: AccessSnapshot | null,
  canManage: boolean,
): HomeLiveCardData[] {
  const widgets = buildCommandCenterWidgets(state, snapshot, canManage);
  const guests = state.guests || [];
  const metrics = guestMetrics(guests);
  const guestIssues = guestAlerts(guests);
  const buzz = { ...DEFAULT_BUZZ, ...state.buzz };
  const rm = roomMetrics(state);

  const byId = (id: string) => widgets.find((w) => w.id === id);

  const cards: HomeLiveCardData[] = [];

  const guestsWidget = byId("guests");
  if (guestsWidget) {
    const tone = liveTone(guestsWidget.status);
    const pending = guestIssues.pendingInvites;
    cards.push({
      id: "guests",
      to: guestsWidget.to,
      title: "Guests",
      icon: "groups",
      tag: pending > 0 ? `${pending} left` : tone.tag,
      tagTone: pending > 0 ? "review" : tone.tagTone,
      needsAction: guestsWidget.status !== "ok",
      isOk: guestsWidget.status === "ok",
      actionLine:
        guests.length === 0
          ? "Add your guest list"
          : pending > 0
            ? "Invites pending"
            : "Looking good",
      headline: guests.length === 0 ? "Add guests" : `${metrics.headTotal} people`,
      meta: guests.length
        ? [
            `${metrics.inviteSentTotal} / ${metrics.familyCount} sent`,
            ...(metrics.stayTotal > 0 ? [`${metrics.stayTotal} stay`] : []),
          ]
        : [],
      cta: tone.cta,
    });
  }

  const stayWidget = byId("stay");
  if (stayWidget) {
    const tone = liveTone(stayWidget.status);
    const unmapped = rm.unassignedGuests;
    cards.push({
      id: "stay",
      to: stayWidget.to,
      title: "Stay",
      icon: "hotel",
      tag: stayWidget.status === "attention" ? "Setup" : tone.tag,
      tagTone: stayWidget.status === "attention" ? "setup" : tone.tagTone,
      needsAction: stayWidget.status !== "ok",
      isOk: stayWidget.status === "ok",
      actionLine:
        metrics.stayTotal === 0
          ? stayWidget.alert || stayWidget.detail
          : rm.totalRooms === 0
            ? "Need rooms"
            : unmapped > 0
              ? `Map ${metrics.stayTotal} rooms`
              : "Rooms mapped",
      headline:
        metrics.stayTotal === 0
          ? guests.length === 0
            ? "Set up stay"
            : "No stay needed"
          : `${metrics.stayTotal} need stay`,
      meta: ["Rooms"],
      cta: "Open",
    });
  }

  const buzzWidget = byId("buzz");
  if (buzzWidget) {
    const tone = liveTone(buzzWidget.status);
    const venueSet = Boolean(buzz.venueName?.trim());
    const mapsSet = Boolean(buzz.venueMapUrl?.trim());
    cards.push({
      id: "buzz",
      to: buzzWidget.to,
      title: "Buzz",
      icon: "campaign",
      tag: tone.tag,
      tagTone: tone.tagTone,
      needsAction: buzzWidget.status !== "ok",
      isOk: buzzWidget.status === "ok",
      actionLine: buzzWidget.status === "ok" ? "Looking good" : "Finish content",
      headline: buzz.welcomeTitle?.trim() || "You're invited",
      meta: [venueSet ? "Venue set" : "Add venue", ...(mapsSet ? ["Maps"] : [])],
      cta: buzzWidget.status === "ok" ? "View" : "Open",
    });
  }

  if (canManage) {
    cards.push({
      id: "buddies",
      to: "/buddies",
      title: "Buddies",
      icon: "handshake",
      tag: "Ready",
      tagTone: "ok",
      needsAction: false,
      isOk: true,
      actionLine: "Team access",
      headline: "Buddies",
      meta: [],
      cta: "Open",
      parkChrome: true,
    });
  }

  return cards;
}

export { buildSetupTasks, setupProgress };
