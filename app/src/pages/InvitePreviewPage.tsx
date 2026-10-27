import { useMemo } from "react";
import { GuestInviteLanding } from "../components/guest/GuestInviteLanding";
import type { InviteBuzzPeekContent } from "../components/guest/InviteBuzzPeek";
import { Icon } from "../components/ui/Icon";
import { getDayPlan } from "../domain/dayPlan";
import {
  datedWeddingFunctions,
  formatWeddingScheduleHome,
  functionDateParts,
  resolveDayName,
} from "../domain/functions";
import { useWeddingState } from "../hooks/useWeddingState";
import { useNavigateInsideEvent } from "../navigation/eventHistory";

/**
 * Host dress-rehearsal: banner → scan → film?/note?/invitation → Buzz peek → RSVP → print + stamp.
 */
export function InvitePreviewPage() {
  const go = useNavigateInsideEvent();
  const { state, showToast } = useWeddingState();

  const nextDay = useMemo(() => {
    const first = (state.functions || []).find((row) => row.date || row.name);
    if (!first) return "";
    if (typeof first.id === "number") return resolveDayName(state, first.id);
    return first.name || "";
  }, [state]);

  const dateLine = useMemo(() => {
    const first = (state.functions || []).find((row) => row.date);
    return first?.date || state.event?.startDate || nextDay;
  }, [state, nextDay]);

  const buzzPeek = useMemo<InviteBuzzPeekContent>(() => {
    const schedule = formatWeddingScheduleHome(state);
    const dated = datedWeddingFunctions(state);
    const days = dated.map((fn) => {
      const parts = functionDateParts(fn.date);
      const plan = getDayPlan(state, fn.id);
      return {
        id: fn.id,
        name: fn.name || "Event",
        day: parts.day,
        month: parts.month,
        weekday: parts.weekday,
        detail: parts.detail,
        beats: plan.blocks.slice(0, 3).map((block) => ({
          title: block.title,
          time: block.timeStart,
          place: block.place,
        })),
      };
    });
    return {
      eventName: state.event?.name || "Your event",
      guestName: "Guest",
      venueName: state.buzz?.venueName || "",
      welcomeTitle: state.buzz?.welcomeTitle || "",
      scheduleHeadline: schedule.headline,
      scheduleDetail: schedule.detail,
      countdownTarget: dated[0]?.date || state.event?.startDate || "",
      days,
      playEnabled: true,
    };
  }, [state]);

  const message =
    (state.buzz?.welcomeMessage || "").trim() ||
    (state.buzz?.invitationNote || "").trim();
  const welcomeTitle = (state.buzz?.welcomeTitle || "").trim();
  const media = (state.buzz?.letterPhotoUrl || "").trim() || null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <GuestInviteLanding
        mode="preview"
        className="invite-guest-preview"
        buzzPeek={buzzPeek}
        pass={{
          eventName: state.event?.name || "Your event",
          guestName: "Guest",
          dateLine,
          venueName: state.buzz?.venueName || "",
          claimCode: "PREVIEW",
          backgroundUrl: state.buzz?.passArtUrl || null,
        }}
        letter={{
          templateId: "classic",
          eventName: state.event?.name || "Your event",
          guestName: "Guest",
          welcomeTitle,
          welcomeMessage: message,
          note: "",
          venueName: "",
          photoUrl: media,
        }}
        onAccept={async () => {
          showToast("Preview · guests would join here");
        }}
        onContinueBrowser={(name) =>
          showToast(
            name
              ? `Preview · ${name} would open BiyeFlow in browser`
              : "Preview · guests would continue in browser",
          )
        }
        onStoreTap={(store) =>
          showToast(
            store === "apple"
              ? "Preview · App Store handoff"
              : "Preview · Google Play handoff",
          )
        }
        header={
          <header className="relative z-30 flex shrink-0 items-center gap-2 px-3 pb-2 pt-2">
            <button
              type="button"
              onClick={() => go("/people/invites")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/45 backdrop-blur-md"
              aria-label="Back to Invitations"
            >
              <Icon name="arrow_back" className="text-[18px]" />
            </button>
            <div className="min-w-0 flex-1 rounded-full bg-black/45 px-3 py-2 backdrop-blur-md">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#feca43]">
                Try it yourself
              </p>
              <p className="truncate text-[12px] font-semibold text-white/70">
                Open as a guest
              </p>
            </div>
          </header>
        }
      />
    </div>
  );
}
