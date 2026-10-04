import type { ActivityType } from "./types";

/** In-app inbox deep-link for a notification type. */
export function activityDeepLink(type: ActivityType | string): string {
  switch (type) {
    case "task.assigned":
    case "task.updated":
      return "/buddies";
    case "buzz.published":
    case "broadcast":
      return "/buzz";
    case "invite.claimed":
      return "/people/invites";
    default:
      return "/command-center";
  }
}

/** Push banners always open Home (event home when possible). */
export function pushHomeHref(hasOpenEvent: boolean): string {
  return hasOpenEvent ? "/command-center" : "/dashboard";
}

export function activityIcon(type: ActivityType | string): string {
  switch (type) {
    case "task.assigned":
    case "task.updated":
      return "handshake";
    case "buzz.published":
    case "broadcast":
      return "campaign";
    case "invite.claimed":
      return "mark_email_read";
    default:
      return "notifications";
  }
}
