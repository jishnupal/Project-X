import { useMemo, useState } from "react";
import { useAccess } from "../../hooks/useAccess";
import { useWeddingState } from "../../hooks/useWeddingState";
import { DEFAULT_BUZZ } from "../../domain/defaults";
import type { BuzzContent } from "../../domain/types";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

function BuzzField({
  label,
  value,
  onChange,
  multiline,
  editing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  editing: boolean;
}) {
  if (!editing) {
    return (
      <div>
        <p className="font-label-caps text-[9px] tracking-[0.14em] text-secondary">{label}</p>
        <p className="text-[14px] text-primary mt-1 whitespace-pre-wrap leading-relaxed">{value}</p>
      </div>
    );
  }
  const className =
    "mt-1.5 w-full rounded-xl border border-[rgba(128,0,32,0.14)] bg-white px-3.5 py-2.5 text-primary outline-none focus:border-[#cca730]";
  return (
    <label className="block">
      <span className="font-label-caps text-[9px] tracking-[0.14em] text-primary">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className={cn(className, "resize-y min-h-[96px]")}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={className} />
      )}
    </label>
  );
}

export function BuzzBoard() {
  const { state, saveState, showToast } = useWeddingState();
  const { canAccessModule } = useAccess();
  const canEdit = canAccessModule("buzz", "edit");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BuzzContent>(() => ({
    ...DEFAULT_BUZZ,
    ...state.buzz,
  }));

  const buzz = useMemo(
    () => ({ ...DEFAULT_BUZZ, ...state.buzz }),
    [state.buzz],
  );

  const onSave = () => {
    saveState({ ...state, buzz: draft });
    setEditing(false);
    showToast("BUZZ updated");
  };

  const content = editing ? draft : buzz;

  return (
    <div className="max-w-lg mx-auto py-3 lg:py-4 px-1 space-y-4 lg:space-y-5">
      <div className="rounded-2xl lg:rounded-3xl overflow-hidden border border-[rgba(128,0,32,0.12)] bg-gradient-to-br from-[#fff8f0] to-white">
        <div className="px-4 py-5 lg:px-5 lg:py-6">
          <p className="font-label-caps text-[8px] lg:text-[9px] tracking-[0.18em] text-[#a67c00]">BUZZ</p>
          <h1 className="font-headline-md text-primary text-[22px] lg:text-[28px] mt-1.5 lg:mt-2 leading-tight tracking-[-0.01em]">
            {content.welcomeTitle}
          </h1>
          <p className="text-[13px] lg:text-[14px] text-secondary mt-2 lg:mt-3 leading-relaxed whitespace-pre-wrap">
            {content.welcomeMessage}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="mail" className="text-primary text-[20px]" />
          <p className="font-headline-md text-primary text-[18px]">Invitation</p>
        </div>
        {editing ? (
          <>
            <BuzzField
              label="Welcome title"
              value={draft.welcomeTitle}
              onChange={(welcomeTitle) => setDraft({ ...draft, welcomeTitle })}
              editing
            />
            <BuzzField
              label="Welcome message"
              value={draft.welcomeMessage}
              onChange={(welcomeMessage) => setDraft({ ...draft, welcomeMessage })}
              editing
              multiline
            />
            <BuzzField
              label="Invitation note"
              value={draft.invitationNote}
              onChange={(invitationNote) => setDraft({ ...draft, invitationNote })}
              editing
              multiline
            />
          </>
        ) : (
          <p className="text-[14px] text-primary leading-relaxed whitespace-pre-wrap">
            {content.invitationNote}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[rgba(128,0,32,0.12)] bg-white p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Icon name="location_on" className="text-primary text-[20px]" />
          <p className="font-headline-md text-primary text-[18px]">Venue</p>
        </div>
        {editing ? (
          <>
            <BuzzField
              label="Venue name"
              value={draft.venueName}
              onChange={(venueName) => setDraft({ ...draft, venueName })}
              editing
            />
            <BuzzField
              label="Address"
              value={draft.venueAddress}
              onChange={(venueAddress) => setDraft({ ...draft, venueAddress })}
              editing
              multiline
            />
            <BuzzField
              label="Map link"
              value={draft.venueMapUrl}
              onChange={(venueMapUrl) => setDraft({ ...draft, venueMapUrl })}
              editing
            />
          </>
        ) : (
          <>
            <p className="font-headline-md text-primary text-[16px]">{content.venueName}</p>
            <p className="text-[14px] text-secondary whitespace-pre-wrap">{content.venueAddress}</p>
            {content.venueMapUrl ? (
              <a
                href={content.venueMapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] text-primary font-button"
              >
                Open in Maps
                <Icon name="open_in_new" className="text-[16px]" />
              </a>
            ) : null}
          </>
        )}
      </section>

      {canEdit ? (
        <div className="grid gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={onSave}
                className="h-11 rounded-full bg-primary text-on-primary font-button text-[13px]"
              >
                Save BUZZ
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft({ ...DEFAULT_BUZZ, ...state.buzz });
                  setEditing(false);
                }}
                className="h-11 rounded-full border border-[rgba(128,0,32,0.18)] text-primary font-button text-[13px]"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="h-11 rounded-full bg-tertiary-container text-on-tertiary-container font-button text-[13px]"
            >
              Edit BUZZ
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
