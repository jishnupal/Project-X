import type { AccessSnapshot } from "./access/types";
import { DEFAULT_BUZZ } from "./defaults";
import { guestMetrics } from "./guest";
import { menuItemsArray } from "./menu";
import { buildSetupTasks, setupProgress } from "./onboardingProgress";
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
    widgets.push({
      id: "stay",
      title: "Stay",
      icon: "hotel",
      to: "/people/rooms",
      status: "attention",
      value: String(metrics.stayTotal),
      detail: "Need rooms",
      alert: "Tap to map",
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

export { buildSetupTasks, setupProgress };
