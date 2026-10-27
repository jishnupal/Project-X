import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { useAuth, type EventMembership } from "../hooks/useAuth";
import { useAccess } from "../hooks/useAccess";
import { useWeddingState } from "../hooks/useWeddingState";
import { clearEventListHold } from "../domain/access/eventListHold";
import { Icon } from "../components/ui/Icon";

const WASHES = [
  "linear-gradient(160deg, #ffe9a6 0%, #feca43 46%, #ffd56a 100%)",
  "linear-gradient(160deg, #e4f3f3 0%, #7eafb2 52%, #c5dedf 100%)",
  "linear-gradient(160deg, #fbe6e9 0%, #e7a0ad 50%, #f4cdd4 100%)",
  "linear-gradient(160deg, #ffe4d2 0%, #ee9460 52%, #ffc9a4 100%)",
  "linear-gradient(200deg, #fff4c8 0%, #f6c14a 42%, #ffb07a 100%)",
] as const;

function firstName(name: string) {
  const part = name.trim().split(/\s+/)[0];
  return part || name;
}

function toneFor(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n += id.charCodeAt(i) * (i + 3);
  return { wash: WASHES[Math.abs(n) % WASHES.length] };
}

function placeLabel(membership: EventMembership) {
  if (membership.role === "buddy") return "Buddy";
  if (membership.role === "guest") return "Guest";
  if (membership.owner) return "Host";
  return "Co-host";
}

function eventLines(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const body = words[0]?.toLowerCase() === "the" ? words.slice(1) : words;
  return ["The", ...(body.length ? body : ["Event"])];
}

function lineLook(word: string, index: number) {
  const caps = [28, 20, 16];
  const weights = [800, 700, 600];
  const base = caps[Math.min(index, caps.length - 1)];
  const fit = Math.floor(186 / Math.max(word.length * 0.58, 1));
  return {
    fontSize: Math.max(14, Math.min(base, fit)),
    fontWeight: weights[Math.min(index, weights.length - 1)],
  };
}

function YellowButton({
  disabled,
  type = "button",
  onClick,
  children,
}: {
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#feca43] text-[16px] font-semibold text-black active:scale-[0.98] disabled:opacity-70"
    >
      {children}
    </button>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const calm = useReducedMotion() ?? false;
  const { user, memberships, status, logout, createEvent, deleteEvent } = useAuth();
  const { enterAsHost, enterAsMember } = useAccess();
  const { joinWeddingLink } = useWeddingState();

  const [eventName, setEventName] = useState("");
  const [naming, setNaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [openingCode, setOpeningCode] = useState<string | null>(null);
  const [lift, setLift] = useState<{
    code: string;
    top: number;
    left: number;
    shiftX: number;
    fromScale: number;
    phase: "center" | "grow";
  } | null>(null);
  const [active, setActive] = useState(0);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventMembership | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const accountRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const signingOut = useRef(false);

  useEffect(() => {
    if (signingOut.current) return;
    if (status === "anon") navigate("/login", { replace: true });
  }, [status, navigate]);

  useEffect(() => {
    if (!showAccount) return;
    const close = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setShowAccount(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showAccount]);

  const syncActive = useCallback(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const mid = root.scrollLeft + root.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    Array.from(root.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const center = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    setActive(best);
  }, []);

  useEffect(() => {
    syncActive();
  }, [memberships.length, syncActive]);

  useEffect(() => {
    if (!focusCode) return;
    const root = scrollerRef.current;
    const el = root?.querySelector<HTMLElement>(`[data-event-code="${focusCode}"]`);
    el?.scrollIntoView({ behavior: calm ? "auto" : "smooth", inline: "center", block: "nearest" });
  }, [focusCode, memberships, calm]);

  const openEvent = useCallback(
    async (membership: EventMembership) => {
      const code = membership.eventCode;
      if (openingCode || lift) return;
      setError("");
      const card = scrollerRef.current?.querySelector<HTMLElement>(`[data-event-code="${code}"]`);
      const rect = card?.getBoundingClientRect();
      const shiftX = rect ? window.innerWidth / 2 - (rect.left + rect.width / 2) : 0;
      const fromScale = Math.abs(shiftX) < 8 ? 1 : 0.9;
      const travel = calm || Math.abs(shiftX) < 8 ? 0 : 520;
      setLift({
        code,
        top: rect?.top ?? 0,
        left: rect?.left ?? 0,
        shiftX: travel ? shiftX : 0,
        fromScale,
        phase: travel ? "center" : "grow",
      });
      const started = Date.now();
      const destination =
        membership.role === "guest" ? "/buzz" : membership.role === "buddy" ? "/buddies" : "/command-center";
      try {
        const work = (async () => {
          await joinWeddingLink(code);
          if (membership.role === "guest" || membership.role === "buddy") await enterAsMember(code);
          else await enterAsHost(code);
        })();
        if (travel) {
          await new Promise((resolve) => window.setTimeout(resolve, travel));
          setLift((current) => (current && current.code === code ? { ...current, phase: "grow" } : current));
        }
        setOpeningCode(code);
        await work;
        clearEventListHold();
        const sinceGrow = Date.now() - (started + travel);
        const hold = calm ? 0 : Math.max(0, 1150 - sinceGrow);
        if (hold) await new Promise((resolve) => window.setTimeout(resolve, hold));
        navigate(destination);
      } catch (err) {
        setLift(null);
        setOpeningCode(null);
        setError(err instanceof Error ? err.message : "Could not open this event");
      }
    },
    [calm, enterAsHost, enterAsMember, joinWeddingLink, lift, navigate, openingCode],
  );

  const handleCreate = async () => {
    const name = eventName.trim();
    if (busy || !name) return;
    setBusy(true);
    setError("");
    try {
      const created = await createEvent(name, "wedding");
      setEventName("");
      setNaming(false);
      setFocusCode(created.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start the event");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteEvent(deleteTarget.eventId);
      setDeleteTarget(null);
      setDeleteStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete this event");
      setDeleteTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    signingOut.current = true;
    clearEventListHold();
    await logout();
    window.location.replace("/login?stay=1&pick=1");
  };

  if (!user || status !== "authenticated") {
    return <div className="min-h-dvh bg-[#fff8f5]" aria-busy="true" />;
  }

  const count = memberships.length;

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden bg-[#fff8f5] text-black">
      <motion.header
        animate={calm || !openingCode ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={{ duration: calm ? 0 : 1.15, ease: [0.45, 0, 0.15, 1] }}
        className="relative z-10 px-6 pt-[max(0.75rem,env(safe-area-inset-top))]"
      >
        <div className="flex items-center justify-between">
          <div className="font-[Manrope,sans-serif] text-black">
            <p className="text-[20px] font-black leading-none tracking-[-0.06em]">B</p>
            <p className="mt-0.5 text-[10px] font-bold leading-none tracking-[0.22em]">BIYEFLOW</p>
          </div>
          <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Notifications"
            data-testid="dashboard-notifications"
            onClick={() => navigate("/notifications", { state: { from: "/dashboard" } })}
            className="grid h-10 w-10 place-items-center rounded-full text-[#584141] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            <Icon name="notifications" className="text-[22px]" />
          </button>
          <div className="relative" ref={accountRef}>
          <button
            type="button"
            aria-expanded={showAccount}
            aria-haspopup="menu"
            aria-label="Account"
            onClick={() => setShowAccount((open) => !open)}
            className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#ece7e2] text-[15px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              firstName(user.name).slice(0, 1)
            )}
          </button>
          {showAccount ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-10 mt-2 w-44 overflow-hidden rounded-2xl bg-[#fff8f5] py-1 shadow-[0_12px_32px_rgba(30,27,24,0.16)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShowAccount(false);
                  navigate("/profile");
                }}
                className="block w-full px-4 py-2.5 text-left text-[15px] font-semibold text-black"
              >
                Profile
              </button>
              {user.platformRole === "platform_admin" ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setShowAccount(false);
                    navigate("/admin");
                  }}
                  className="block w-full px-4 py-2.5 text-left text-[15px] font-semibold text-black"
                >
                  Customers
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleSignOut()}
                className="block w-full px-4 py-2.5 text-left text-[15px] font-semibold text-[#584141]"
              >
                Log out
              </button>
            </div>
          ) : null}
          </div>
          </div>
        </div>
        <div className="mt-20 min-w-0">
          <p className="font-['Courgette',cursive] text-[44px] font-normal leading-[1.25] text-black">
            Hi, {firstName(user.name)}!
          </p>
          <p
            className="mt-1 max-w-[240px] text-[17px] font-normal leading-snug text-[#584141]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}
          >
            {count === 0 ? "Name your event, then open the card." : "Choose an event to continue."}
          </p>
        </div>
      </motion.header>

      <div className="relative flex min-h-0 flex-1 items-center">
        <Strip calm={calm || Boolean(openingCode)} quiet={Boolean(openingCode) && !calm} />
        {count === 0 ? (
          <div className="relative z-10 mx-auto w-[min(100%-3rem,280px)]">
            <NameCard
              eventName={eventName}
              busy={busy}
              onChange={setEventName}
              onSubmit={() => void handleCreate()}
            />
          </div>
        ) : (
          <div
            ref={scrollerRef}
            onScroll={syncActive}
            className={`relative z-10 flex w-full snap-x snap-mandatory items-center gap-4 overflow-x-auto px-[max(1.5rem,calc(50%-116px))] py-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${openingCode || lift ? "pointer-events-none" : ""}`}
          >
            {memberships.map((membership, index) => (
              <EventCard
                key={membership.id}
                membership={membership}
                active={index === active}
                solo={count === 1 && index === active && !lift && !openingCode}
                calm={calm}
                opening={openingCode === membership.eventCode}
                lifted={lift?.code === membership.eventCode ? lift : null}
                receding={openingCode !== null && openingCode !== membership.eventCode}
                disabled={openingCode !== null || lift !== null}
                onOpen={() => void openEvent(membership)}
                onDelete={
                  membership.owner && membership.empty
                    ? () => {
                        setDeleteTarget(membership);
                        setDeleteStep(1);
                      }
                    : undefined
                }
              />
            ))}
            <AddEventCard
              active={active === count}
              calm={calm}
              receding={openingCode !== null}
              naming={naming}
              eventName={eventName}
              busy={busy}
              onStart={() => setNaming(true)}
              onChange={setEventName}
              onCancel={() => {
                setNaming(false);
                setEventName("");
                setError("");
              }}
              onSubmit={() => void handleCreate()}
            />
          </div>
        )}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-sm px-6 pb-10 text-center">
        {error ? (
          <p className="mt-3 text-[13px] text-[#ba1a1a]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-20 flex items-end justify-center bg-black/35 px-4 pb-8"
          role="dialog"
          aria-modal
        >
          <div className="w-full max-w-sm rounded-[24px] bg-[#fff8f5] px-5 py-5 text-center">
            <p className="text-[22px] font-extrabold tracking-[-0.04em]">
              {deleteStep === 1 ? "Delete this event?" : "Remove it for a day?"}
            </p>
            <p className="mt-2 text-[14px] text-[#584141]">
              {deleteStep === 1
                ? "Nothing is set up on this card, so it can go."
                : "It leaves the row now. You can restore it for a day."}
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (deleteStep === 1) setDeleteStep(2);
                else void handleDelete();
              }}
              className="mt-5 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-[#424242] text-[16px] font-semibold text-white"
            >
              {deleteStep === 1 ? "Continue" : busy ? "Deleting…" : "Delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteStep(1);
              }}
              className="mt-3 text-[13px] font-semibold text-[#584141]"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Strip({ calm, quiet = false }: { calm: boolean; quiet?: boolean }) {
  return (
    <motion.div
      aria-hidden
      animate={{ opacity: quiet ? 0.35 : 1 }}
      transition={{ duration: calm ? 0 : 1.15, ease: [0.45, 0, 0.15, 1] }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <motion.div
        className="absolute left-[-30%] top-[46%] h-[168px] w-[160%] bg-[#feca43]"
        style={{ rotate: -8 }}
        animate={calm ? undefined : { x: ["-4%", "4%"] }}
        transition={calm ? undefined : { duration: 16, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[-20%] top-[58%] h-[22px] w-[150%] bg-[#e07a3d]"
        style={{ rotate: -8 }}
        animate={calm ? undefined : { x: ["3%", "-5%"] }}
        transition={calm ? undefined : { duration: 22, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function EventCard({
  membership,
  active,
  solo,
  calm,
  opening,
  lifted,
  receding,
  disabled,
  onOpen,
  onDelete,
}: {
  membership: EventMembership;
  active: boolean;
  solo: boolean;
  calm: boolean;
  opening: boolean;
  lifted: {
    top: number;
    left: number;
    shiftX: number;
    fromScale: number;
    phase: "center" | "grow";
  } | null;
  receding: boolean;
  disabled: boolean;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const tone = toneFor(membership.eventId || membership.eventName);
  const lines = eventLines(membership.eventName);

  const face = (
      <motion.div
        data-open-card={lifted ? membership.eventCode : undefined}
        initial={lifted ? { x: 0, y: 0, scale: lifted.fromScale, opacity: 1 } : false}
        animate={
          calm
            ? undefined
            : lifted
              ? lifted.phase === "grow"
                ? { x: lifted.shiftX, y: -28, scale: 1.32, opacity: 1 }
                : { x: lifted.shiftX, y: 0, scale: lifted.fromScale, opacity: 1 }
              : opening
                ? { scale: 1.32, y: -28, opacity: 1 }
                : receding
                  ? { scale: 0.92, opacity: 0 }
                  : solo
                    ? { y: [0, -8, 0], scale: 1, opacity: 1 }
                    : { scale: active ? 1 : 0.9, opacity: active ? 1 : 0.78, y: 0 }
        }
        transition={
          calm
            ? { duration: 0 }
            : lifted?.phase === "center"
              ? { duration: 0.52, ease: [0.45, 0, 0.15, 1] }
              : opening || lifted?.phase === "grow" || receding
                ? { duration: 1.15, ease: [0.45, 0, 0.15, 1] }
                : solo
                  ? { duration: 5.2, repeat: Infinity, ease: "easeInOut" }
                  : { type: "spring", stiffness: 340, damping: 30 }
        }
        style={
          lifted
            ? {
                position: "fixed",
                top: lifted.top,
                left: lifted.left,
                width: 232,
                height: 320,
                zIndex: 80,
                backgroundImage: tone.wash,
              }
            : { backgroundImage: tone.wash }
        }
        className="relative h-full w-full overflow-hidden rounded-[28px] text-left text-black shadow-[0_18px_40px_rgba(30,27,24,0.16)]"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-8 right-12 w-[7px] rounded-full"
          style={{ backgroundImage: "linear-gradient(to bottom, #ffffff 0%, #ffffff 62%, #fff4c4 82%, #feca43 100%)" }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-8 right-8 w-[7px] rounded-full"
          style={{ backgroundImage: "linear-gradient(to bottom, #ffffff 0%, #ffffff 62%, #fff4c4 82%, #feca43 100%)" }}
        />
        <span
          aria-hidden
          className="absolute left-5 top-5 h-[22px] w-[22px] rounded-full bg-[#fff8f5] shadow-[inset_0_2px_3px_rgba(30,27,24,0.35),0_0_0_3px_rgba(30,27,24,0.1)]"
        />
        <div className="pointer-events-none absolute inset-x-5 top-[4.75rem] z-10 flex flex-col gap-1 text-left">
          {lines.map((line, index) => (
            <span
              key={`${line}-${index}`}
              className="block uppercase leading-[0.95] tracking-[-0.04em]"
              style={lineLook(line, index)}
            >
              {line}
            </span>
          ))}
        </div>
        <button
          type="button"
          aria-label={`Open ${membership.eventName}`}
          disabled={disabled}
          onClick={onOpen}
          className="absolute inset-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:opacity-70"
        />
        <span
          className={
            membership.role === "guest"
              ? "pointer-events-none absolute bottom-5 left-5 rounded-full bg-[rgba(255,252,248,0.88)] px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-[#584141] shadow-[0_6px_16px_rgba(30,27,24,0.08)]"
              : "pointer-events-none absolute bottom-6 left-5 text-[13px] font-semibold text-[#584141]"
          }
        >
          {placeLabel(membership)}
        </span>
      </motion.div>
  );

  return (
    <div
      data-event-code={membership.eventCode}
      className="group relative h-[320px] w-[232px] shrink-0 snap-center"
    >
      {lifted ? createPortal(face, document.body) : face}
      {onDelete && !lifted ? (
        <button
          type="button"
          aria-label={`Delete ${membership.eventName}`}
          onClick={onDelete}
          className={`absolute right-3 top-3 z-20 grid h-8 w-8 place-items-center rounded-full text-[#584141] transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100 ${active ? "opacity-100 sm:opacity-0" : "opacity-0"}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 7h14M9 7V5h6v2M8 7l1 13h6l1-13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}

function AddEventCard({
  active,
  calm,
  receding,
  naming,
  eventName,
  busy,
  onStart,
  onChange,
  onCancel,
  onSubmit,
}: {
  active: boolean;
  calm: boolean;
  receding: boolean;
  naming: boolean;
  eventName: string;
  busy: boolean;
  onStart: () => void;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      animate={
        calm ? undefined : receding ? { scale: 0.9, opacity: 0 } : { scale: active ? 1 : 0.86, opacity: active ? 1 : 0.62 }
      }
      transition={
        calm ? { duration: 0 } : receding ? { duration: 1.15, ease: [0.45, 0, 0.15, 1] } : { type: "spring", stiffness: 340, damping: 30 }
      }
      className="flex h-[220px] w-[148px] shrink-0 snap-center flex-col justify-end rounded-[28px] bg-white/70 px-4 pb-5 shadow-[0_18px_40px_rgba(30,27,24,0.1)]"
    >
      {naming ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <input
            value={eventName}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Name"
            autoFocus
            aria-label="Event name"
            className="h-10 w-full border-0 border-b border-[#e6e6e6] bg-transparent text-[16px] font-extrabold tracking-[-0.03em] text-black outline-none placeholder:font-semibold placeholder:text-[#b5b5b5]"
          />
          <button
            type="submit"
            disabled={busy || !eventName.trim()}
            className="mt-4 h-10 w-full rounded-full bg-[#feca43] text-[14px] font-semibold text-black disabled:opacity-70"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button type="button" onClick={onCancel} className="mt-2 text-[12px] font-semibold text-[#584141]">
            Cancel
          </button>
        </form>
      ) : (
        <button type="button" onClick={onStart} className="text-left">
          <span className="block text-[28px] font-extrabold leading-none tracking-[-0.04em]">+</span>
          <span className="mt-2 block text-[14px] font-semibold">Add event</span>
        </button>
      )}
    </motion.div>
  );
}

function NameCard({
  eventName,
  busy,
  onChange,
  onSubmit,
}: {
  eventName: string;
  busy: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="rounded-[28px] bg-white px-5 py-6 text-center shadow-[0_18px_40px_rgba(30,27,24,0.16)]"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p className="text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em]">Name it</p>
      <input
        value={eventName}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Event name"
        autoFocus
        aria-label="Event name"
        className="mt-4 h-12 w-full border-0 border-b border-[#e6e6e6] bg-transparent text-center text-[18px] font-extrabold tracking-[-0.03em] text-black outline-none placeholder:font-semibold placeholder:text-[#b5b5b5]"
      />
      <div className="mt-5">
        <YellowButton type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create"}
        </YellowButton>
      </div>
    </form>
  );
}
