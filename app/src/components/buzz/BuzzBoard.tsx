import { useMemo, useState, type InputHTMLAttributes } from "react";
import { BoardingPass } from "../guest/BoardingPass";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { DEFAULT_BUZZ } from "../../domain/defaults";
import type { BuzzContent } from "../../domain/types";
import { BuzzPlayBoard } from "./BuzzPlayBoard";
import { appendActivity, createActivityItem } from "../../domain/activity";
import { dispatchPushNotify } from "../../domain/pushClient";
import { useAuth } from "../../hooks/useAuth";
import { useNavigateInsideEvent } from "../../navigation/eventHistory";

function BuzzField({
  id,
  label,
  value,
  onChange,
  multiline,
  rows = 1,
  tone = "body",
  type = "text",
  inputMode,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  tone?: "display" | "body" | "venue" | "quiet";
  type?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
}) {
  const fieldClass = [
    "buzz-field",
    tone === "display" && "buzz-field--display",
    tone === "venue" && "buzz-field--venue",
    tone === "quiet" && "buzz-field--quiet",
    multiline && "buzz-field--area",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="buzz-field-wrap" htmlFor={id}>
      <span className="sr-only">{label}</span>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={fieldClass}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={fieldClass}
        />
      )}
    </label>
  );
}

const STALE_VENUE_HINT = "Add venue address in BUZZ edit mode";

function withLiveBuzz(buzz: BuzzContent): BuzzContent {
  return {
    ...DEFAULT_BUZZ,
    ...buzz,
    venueAddress:
      !buzz.venueAddress || buzz.venueAddress === STALE_VENUE_HINT
        ? ""
        : buzz.venueAddress,
  };
}

export function BuzzBoard() {
  const go = useNavigateInsideEvent();
  const { state, saveState, showToast, syncCode } = useWeddingState();
  const { canAccessModule, isGuest } = useAccess();
  const { memberships } = useAuth();
  const canEdit = canAccessModule("buzz", "edit");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BuzzContent>(() => withLiveBuzz(state.buzz));
  const [publishing, setPublishing] = useState(false);

  const buzz = useMemo(() => withLiveBuzz(state.buzz), [state.buzz]);
  const membership = memberships.find(
    (m) => m.eventCode.toUpperCase() === (syncCode || "").toUpperCase(),
  );
  const viewerName = useMemo(() => {
    try {
      return sessionStorage.getItem("biyeflow.viewerName") || "";
    } catch {
      return "";
    }
  }, [state.buzz]);

  const onSaveDraft = () => {
    saveState({ ...state, buzz: draft });
    setEditing(false);
    showToast("Saved");
  };

  const onPublish = async () => {
    if (publishing) return;
    setPublishing(true);
    try {
      const item = createActivityItem({
        type: "buzz.published",
        title: "New Buzz update",
        body: draft.welcomeTitle?.trim() || "The host shared a fresh invite note",
        href: "/buzz",
        audience: "guest",
      });
      const next = appendActivity({ ...state, buzz: draft }, item);
      saveState(next);
      setEditing(false);
      showToast("Buzz published");
      await dispatchPushNotify({
        eventId: membership?.eventId,
        eventCode: syncCode,
        type: item.type,
        title: item.title,
        body: item.body,
        href: "/command-center",
        audience: "guest",
      });
    } finally {
      setPublishing(false);
    }
  };

  const content = editing ? draft : buzz;
  const dateLine = state.event?.startDate || "";
  const passGuest = viewerName || (isGuest ? "Guest" : "Riya");

  if (editing && canEdit) {
    return (
      <div className="buzz-page is-editing">
        <div className="buzz-page__scroll">
          <div className="buzz-stage">
            <form
              className="buzz-editor"
              onSubmit={(e) => {
                e.preventDefault();
                void onPublish();
              }}
            >
              <p className="buzz-kicker">Edit invite copy</p>
              <BuzzField
                id="buzz-title"
                label="Headline"
                value={draft.welcomeTitle}
                onChange={(welcomeTitle) => setDraft({ ...draft, welcomeTitle })}
                tone="display"
                multiline
                placeholder="Tonight we celebrate"
              />
              <BuzzField
                id="buzz-message"
                label="Welcome note"
                value={draft.welcomeMessage}
                onChange={(welcomeMessage) => setDraft({ ...draft, welcomeMessage })}
                multiline
                placeholder="A line for the people walking in"
              />
              <div className="buzz-set">
                <p className="buzz-set__name">The invite</p>
                <BuzzField
                  id="buzz-invitation"
                  label="Invitation line"
                  value={draft.invitationNote}
                  onChange={(invitationNote) => setDraft({ ...draft, invitationNote })}
                  multiline
                  placeholder="Your presence is the gift"
                />
              </div>
              <div className="buzz-set">
                <p className="buzz-set__name">The place</p>
                <BuzzField
                  id="buzz-venue"
                  label="Venue"
                  value={draft.venueName}
                  onChange={(venueName) => setDraft({ ...draft, venueName })}
                  tone="venue"
                  placeholder="The house"
                />
                <BuzzField
                  id="buzz-address"
                  label="Address"
                  value={draft.venueAddress}
                  onChange={(venueAddress) => setDraft({ ...draft, venueAddress })}
                  multiline
                  placeholder="Street, city"
                />
                <BuzzField
                  id="buzz-map"
                  label="Maps"
                  value={draft.venueMapUrl}
                  onChange={(venueMapUrl) => setDraft({ ...draft, venueMapUrl })}
                  type="url"
                  inputMode="url"
                  tone="quiet"
                  placeholder="Paste a maps link"
                />
              </div>
              <div className="buzz-editor__bar">
                <button type="submit" className="buzz-cta" disabled={publishing}>
                  {publishing ? "Sending…" : "Send update"}
                </button>
                <button type="button" onClick={onSaveDraft} disabled={publishing} className="buzz-cta ghost">
                  Save only
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(withLiveBuzz(state.buzz));
                    setEditing(false);
                  }}
                  disabled={publishing}
                  className="buzz-cta ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buzz-page buzz-page--vibe">
      <div className="buzz-page__scroll">
        <div className="buzz-vibe" style={{ ["--boarding-stage" as string]: "#07040c" }}>
          <div className="buzz-vibe__glow" aria-hidden />
          <p className="buzz-vibe__label">{isGuest ? "Your pass" : "The room"}</p>
          <BoardingPass
            size="hero"
            phase={isGuest ? "stamped" : "open"}
            content={{
              eventName: state.event?.name || "Your event",
              guestName: passGuest,
              dateLine,
              venueName: content.venueName,
              claimCode: isGuest ? "YOURS" : null,
              backgroundUrl: content.passArtUrl || null,
            }}
          />

          {canEdit ? (
            <div className="buzz-vibe__actions">
              <button type="button" className="buzz-vibe__ghost" onClick={() => go("/people/letter")}>
                Guest preview
              </button>
              <button type="button" className="buzz-vibe__ghost" onClick={() => setEditing(true)}>
                Edit copy
              </button>
            </div>
          ) : null}

          {isGuest ? (
            <div className="buzz-vibe__guest">
              <p className="buzz-vibe__whisper">{content.welcomeTitle}</p>
              <BuzzPlayBoard />
              {content.venueName ? (
                <div className="buzz-vibe__venue">
                  <p className="buzz-lab">Venue</p>
                  <p className="buzz-venue">{content.venueName}</p>
                  {content.venueAddress ? <p className="buzz-addr">{content.venueAddress}</p> : null}
                  {content.venueMapUrl ? (
                    <a
                      href={content.venueMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="buzz-map"
                    >
                      Open in Maps
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="buzz-vibe__hint">
              Blank on purpose — the pass is the vibe. Guests land here after they claim.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
