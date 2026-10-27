import { cn } from "../../design-system/cn";

/** Default free template. Pro can unlock more ids later. */
export type InviteLetterTemplateId = "classic";

export type InviteLetterContent = {
  templateId?: InviteLetterTemplateId;
  eventName: string;
  guestName: string;
  welcomeTitle: string;
  welcomeMessage: string;
  note: string;
  venueName?: string;
  /** Still photo on the postcard (not video). */
  photoUrl?: string | null;
  /** Host film URL (streamed); shown on the Film scene, not the postcard. */
  videoUrl?: string | null;
};

type InviteLetterPreviewProps = {
  content: InviteLetterContent;
  className?: string;
  /** Compact card for sheets; immersive for host craft / guest reveal. */
  size?: "full" | "sheet" | "immersive";
  /** When Film scene already showed the video, hide media on the postcard. */
  hideMedia?: boolean;
};

/** True only for real videos — never scan base64 bodies (`.mp4` can appear inside image data). */
function isVideoUrl(url: string) {
  const u = url.trim();
  if (!u) return false;
  if (u.startsWith("data:")) return u.startsWith("data:video");
  try {
    const path = u.startsWith("http") ? new URL(u).pathname : u.split("?")[0] || u;
    return /\.(mp4|webm|mov|m4v)$/i.test(path);
  } catch {
    return /\.(mp4|webm|mov|m4v)$/i.test(u.split("?")[0] || "");
  }
}

/**
 * Handwritten postcard letter — shared by host Preview and guest claim.
 * Layout is template; host supplies message + media.
 * Event-agnostic: stamp is a postmark, not a truncated event label.
 */
export function InviteLetterPreview({
  content,
  className,
  size = "full",
  hideMedia = false,
}: InviteLetterPreviewProps) {
  const templateId = content.templateId || "classic";
  const guest = content.guestName.trim() || "Guest";
  const note = content.note.trim();
  const body =
    content.welcomeMessage.trim() ||
    "You're invited. We'd love to have you with us.";
  const media = hideMedia ? "" : (content.photoUrl || "").trim();
  const mediaIsVideo = media ? isVideoUrl(media) : false;
  const eventLine = content.eventName.trim();

  return (
    <article
      data-template={templateId}
      data-testid="invite-letter"
      className={cn(
        "invite-letter invite-letter--hand",
        size === "immersive" && "invite-letter--immersive",
        size === "sheet" && "invite-letter--sheet",
        hideMedia && "invite-letter--no-media",
        className,
      )}
    >
      <div className="invite-letter__paper" aria-hidden />
      <div className="invite-letter__stamp" aria-hidden>
        <span className="invite-letter__stamp-mark" />
        <span className="invite-letter__stamp-label">INVITE</span>
      </div>

      <div className="invite-letter__body">
        {eventLine ? <p className="invite-letter__event">{eventLine}</p> : null}

        {media ? (
          <figure className="invite-letter__photo">
            {mediaIsVideo ? (
              <video src={media} controls playsInline preload="metadata" />
            ) : (
              <img src={media} alt="" />
            )}
          </figure>
        ) : hideMedia ? null : (
          <figure className="invite-letter__photo invite-letter__photo--blank">
            <span>Add a photo or video</span>
          </figure>
        )}

        <p className="invite-letter__dear">Dear {guest},</p>

        <p className="invite-letter__ink">{body}</p>

        {note ? <p className="invite-letter__ps">{note}</p> : null}

        {content.venueName?.trim() ? (
          <p className="invite-letter__place">— {content.venueName.trim()}</p>
        ) : null}
      </div>
    </article>
  );
}
