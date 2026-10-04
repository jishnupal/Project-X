import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccess } from "../../hooks/useAccess";
import { useAuth } from "../../hooks/useAuth";
import { useWeddingState } from "../../hooks/useWeddingState";
import { countUnreadActivity } from "../../domain/activity";
import { ensureWebPushRegistered } from "../../domain/pushClient";
import { getPushPermission } from "../../domain/pushPermission";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

/** Header bell — opens the Notifications page (no overlay scrim). */
export function NotificationsBell({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, syncCode } = useWeddingState();
  const { session } = useAccess();
  const { memberships, user } = useAuth();
  const [inboxTick, setInboxTick] = useState(0);

  const eventCode = syncCode || session?.weddingCode || "";
  const membership = memberships.find(
    (m) => m.eventCode.toUpperCase() === (eventCode || "").toUpperCase(),
  );
  const role = session?.role || membership?.role || "guest";
  const guestId =
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem("biyeflow.claimGuestId")) ||
    null;

  useEffect(() => {
    if (!eventCode || getPushPermission() !== "granted") return;
    void ensureWebPushRegistered({
      eventId: membership?.eventId,
      eventCode,
    });
  }, [eventCode, membership?.eventId, user?.id]);

  useEffect(() => {
    const bump = () => setInboxTick((n) => n + 1);
    window.addEventListener("biyeflow:activity-inbox", bump);
    window.addEventListener("focus", bump);
    return () => {
      window.removeEventListener("biyeflow:activity-inbox", bump);
      window.removeEventListener("focus", bump);
    };
  }, []);

  const unread = eventCode
    ? countUnreadActivity(state.activity || [], eventCode, role, {
        guestId,
        userId: user?.id,
      })
    : 0;
  void inboxTick;

  return (
    <button
      type="button"
      aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      data-testid="header-notifications"
      onClick={() =>
        navigate("/notifications", { state: { from: `${location.pathname}${location.search}` } })
      }
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full shrink-0 text-[#584141]",
        "lg:hover:text-[#2c2419] lg:hover:bg-white/70 lg:transition-colors",
        compact && "max-lg:text-inherit",
      )}
    >
      <Icon name="notifications" className="text-[20px] max-lg:text-[18px]" />
      {unread > 0 ? (
        <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#feca43] text-[#2c2419] text-[8px] font-bold leading-[14px] text-center">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </button>
  );
}
