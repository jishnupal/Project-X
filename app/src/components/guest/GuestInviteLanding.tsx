import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  BoardingPass,
  type BoardingPassContent,
  type BoardingPassPhase,
} from "./BoardingPass";
import {
  InviteLetterPreview,
  type InviteLetterContent,
} from "./InviteLetterPreview";
import { InviteReceipt } from "./InviteReceipt";
import {
  InviteBuzzPeek,
  type InviteBuzzPeekContent,
} from "./InviteBuzzPeek";
import { InviteScanRitual, SCAN_READOUT_MS } from "./InviteScanRitual";
import {
  InviteBannerCloth,
  InviteVibeStage,
  VIBE_SWIPE_READY_MS,
} from "./InviteVibeStage";
import { cn } from "../../design-system/cn";

export type GuestInviteRsvp = "yes" | "maybe" | "no";
export type { InviteBuzzPeekContent };

/** Banner → scan → film? → note? → Buzz peek → accept → print + stamp → in */
type Scene =
  | "pass"
  | "film"
  | "note"
  | "buzzPeek"
  | "rsvp"
  | "receipt"
  | "stamped"
  | "in";

/** Cloth banner → roll up → pass settle → scan (no reverse) */
type PassFx = "vibe" | "roll" | "spin" | "scanning" | "blasting";

/** Commit spring distance — banner leaves the stage */
const BANNER_EXIT_Y = -720;
/** Pass peels in early so finger + pass share one motion */
const PASS_REVEAL_AT = 0.28;
/** Banner swipe up → commit */
const SWIPE_UP_PX = 64;
const SWIPE_UP_VELOCITY = -420;
const SWIPE_SNAP = { type: "spring" as const, stiffness: 420, damping: 34, mass: 0.75 };
const SWIPE_COMMIT = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };

export type GuestInviteAcceptResult = "continue" | "auth";

type GuestInviteLandingProps = {
  pass: BoardingPassContent;
  letter: InviteLetterContent;
  /** Plots / Dates / games for Buzz sneak peek */
  buzzPeek?: InviteBuzzPeekContent | null;
  mode?: "live" | "preview";
  busy?: boolean;
  /** Start mid-flow after signup (e.g. receipt) */
  initialScene?: Scene;
  /**
   * Yes/Maybe handler. Return `"auth"` to pause for signup;
   * `"continue"` (or void) advances to print + stamp.
   */
  onAccept?: (
    rsvp: "yes" | "maybe",
    displayName: string,
  ) => void | GuestInviteAcceptResult | Promise<void | GuestInviteAcceptResult>;
  /** After CHECKED IN — enter the event (live) */
  onEnterEvent?: (displayName: string) => void;
  onContinueBrowser?: (displayName: string) => void;
  onStoreTap?: (store: "apple" | "google") => void;
  header?: ReactNode;
  className?: string;
};

const RSVP_HINT: Record<GuestInviteRsvp, string> = {
  yes: "You're coming. Wonderful.",
  maybe: "Noted. We'll hold a seat.",
  no: "Thanks for letting us know.",
};

/** Skip empty / placeholder host notes so Preview doesn't show a filler page. */
const GENERIC_NOTES = new Set([
  "You're invited. We'd love to have you with us.",
  "You're invited — we'd love to have you with us.",
  "We are so glad you are here. Open your invitation below.",
]);

const SCAN_MS = SCAN_READOUT_MS;
const BLAST_MS = 500;
const PRINT_MS = 7500;

const SPRING = { type: "spring" as const, stiffness: 280, damping: 28 };

const SCENE_EASE = [0.22, 1, 0.36, 1] as const;

function firstName(full: string) {
  const t = full.trim();
  if (!t) return "Guest";
  return t.split(/\s+/)[0] || "Guest";
}

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

function StoreAppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.3 1.2-.1 1.6-.7 3.1-.7s1.8.7 3.1.7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.9zM14.4 5.9c.6-.8 1.1-1.9.9-3-.9.1-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.7-1.3z" />
    </svg>
  );
}

function StorePlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M3.5 2.4l9.2 9.2-2.1 2.1L3.5 6.1V2.4z" />
      <path fill="#FBBC04" d="M3.5 21.6V17.9l7.1-3.6 2.1 2.1-9.2 5.2z" />
      <path fill="#4285F4" d="M16.9 10.9l-2.6-1.5-2.1 2.1 2.1 2.1 2.6-1.5c.7-.4.7-1.4 0-1.2z" />
      <path fill="#34A853" d="M12.7 11.5L3.5 2.4c-.3.2-.5.5-.5.9v17.4c0 .4.2.7.5.9l9.2-9.2z" />
    </svg>
  );
}

/**
 * Guest door — banner → scan → film?/note? → Buzz peek → RSVP
 * → (signup if needed) → print + CHECKED IN → enter event.
 */
export function GuestInviteLanding({
  pass,
  letter,
  buzzPeek = null,
  mode = "live",
  busy = false,
  initialScene,
  onAccept,
  onEnterEvent,
  onContinueBrowser,
  onStoreTap,
  header,
  className,
}: GuestInviteLandingProps) {
  const reduce = useReducedMotion() ?? false;
  const videoUrl = (letter.videoUrl || "").trim();
  const photoUrl = (letter.photoUrl || "").trim();
  /** Prefer dedicated video URL; legacy letterPhotoUrl may still hold a video data/path. */
  const mediaVideo =
    videoUrl || (photoUrl && isVideoUrl(photoUrl) ? photoUrl : "");
  const mediaPhoto =
    photoUrl && !isVideoUrl(photoUrl) ? photoUrl : "";
  const hasVideo = Boolean(mediaVideo);
  const hasPhoto = Boolean(mediaPhoto);
  /**
   * Film/host media page: always in preview; live when media synced to the invite.
   * Video/photo URLs come from R2 via /api/invites/preview (not JSON blobs).
   */
  const hasFilm = mode === "preview" || hasVideo || hasPhoto;
  const filmSrc = mediaVideo || mediaPhoto;
  const noteRaw = letter.welcomeMessage.trim();
  const noteTitleRaw = letter.welcomeTitle.trim();
  /** Preview always shows the note beat; live skips empty / placeholder copy */
  const hasNote =
    mode === "preview" ||
    hasPhoto ||
    Boolean(noteTitleRaw || (noteRaw && !GENERIC_NOTES.has(noteRaw)));

  const bootScene: Scene =
    initialScene === "receipt" ||
    initialScene === "stamped" ||
    initialScene === "in"
      ? initialScene
      : "pass";

  const [scene, setScene] = useState<Scene>(bootScene);
  const [passFx, setPassFx] = useState<PassFx>(
    bootScene === "pass" ? "vibe" : "spin",
  );
  const [swipeReady, setSwipeReady] = useState(false);
  const [bannerProgress, setBannerProgress] = useState(0);
  const [vibeKey, setVibeKey] = useState(0);
  const [printReady, setPrintReady] = useState(false);
  const [printHint, setPrintHint] = useState(
    bootScene === "receipt" ? "Printing your VVIP slip…" : "Printing your VVIP slip…",
  );
  const [rsvp, setRsvp] = useState<GuestInviteRsvp | null>(
    bootScene === "receipt" || bootScene === "stamped" || bootScene === "in"
      ? "yes"
      : null,
  );
  const [acceptBusy, setAcceptBusy] = useState(false);
  const [displayName, setDisplayName] = useState(
    () => pass.guestName.trim() || "Guest",
  );
  const [storesOpen, setStoresOpen] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const timers = useRef<number[]>([]);
  const swipeReadyTimer = useRef<number | null>(null);
  const isPreview = mode === "preview";
  const guest = firstName(displayName || pass.guestName);
  const eventLine = pass.eventName.trim();

  const showBanner =
    scene === "pass" && (passFx === "vibe" || passFx === "roll");
  const bannerRolled = passFx === "roll";
  const passReveal = Math.max(
    0,
    Math.min(1, (bannerProgress - PASS_REVEAL_AT) / (1 - PASS_REVEAL_AT)),
  );
  const showPassObject =
    scene === "pass" &&
    (passFx === "spin" ||
      passFx === "scanning" ||
      passFx === "blasting" ||
      ((passFx === "vibe" || passFx === "roll") && passReveal > 0));
  /** Purple grain everywhere on the guest door */
  const vibeActive = true;

  const syncBannerProgress = (y: number) => {
    setBannerProgress(
      Math.max(0, Math.min(1, -y / Math.abs(BANNER_EXIT_Y))),
    );
  };

  const peekContent = useMemo<InviteBuzzPeekContent>(() => {
    if (buzzPeek) return buzzPeek;
    return {
      eventName: pass.eventName,
      guestName: displayName || pass.guestName,
      venueName: pass.venueName,
      scheduleHeadline: pass.dateLine,
      countdownTarget: undefined,
      days: [],
      playEnabled: false,
    };
  }, [buzzPeek, pass, displayName]);

  const sceneOrder = useMemo<Scene[]>(() => {
    const steps: Scene[] = ["pass"];
    if (hasFilm) steps.push("film");
    if (hasNote) steps.push("note");
    steps.push("buzzPeek", "rsvp", "receipt", "stamped", "in");
    return steps;
  }, [hasFilm, hasNote]);

  const progressIndex = Math.max(0, sceneOrder.indexOf(scene));
  const progressTotal = sceneOrder.length;

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const closeFilm = () => {
    fullscreenVideoRef.current?.pause();
    videoRef.current?.pause();
    setFilmOpen(false);
  };

  const openFilm = () => {
    if (!filmSrc) return;
    setFilmOpen(true);
  };

  const goAfterFilm = () => {
    closeFilm();
    if (hasNote) setScene("note");
    else setScene("buzzPeek");
  };

  const goAfterScan = () => {
    if (hasFilm) setScene("film");
    else if (hasNote) setScene("note");
    else setScene("buzzPeek");
  };

  const goAfterPeek = () => setScene("rsvp");

  const goAfterReceipt = () => setScene("stamped");

  const restartExperience = () => {
    clearTimers();
    if (swipeReadyTimer.current != null) {
      window.clearTimeout(swipeReadyTimer.current);
      swipeReadyTimer.current = null;
    }
    videoRef.current?.pause();
    fullscreenVideoRef.current?.pause();
    setFilmOpen(false);
    setRsvp(null);
    setAcceptBusy(false);
    setStoresOpen(false);
    setPrintReady(false);
    setPrintHint("Printing your VVIP slip…");
    setDisplayName(pass.guestName.trim() || "Guest");
    setSwipeReady(reduce);
    setBannerProgress(0);
    setVibeKey((k) => k + 1);
    setPassFx("vibe");
    setScene("pass");
  };

  const openPassFromLanding = () => {
    if (scene !== "pass" || passFx !== "vibe") return;
    setSwipeReady(false);
    setBannerProgress(1);
    setPassFx("roll");
  };

  useEffect(() => () => {
    clearTimers();
    if (swipeReadyTimer.current != null) {
      window.clearTimeout(swipeReadyTimer.current);
    }
  }, []);

  useEffect(() => {
    setDisplayName(pass.guestName.trim() || "Guest");
  }, [pass.guestName]);

  // Enable swipe after INVITED lands (flicker keeps running)
  useEffect(() => {
    if (scene !== "pass" || passFx !== "vibe") {
      if (swipeReadyTimer.current != null) {
        window.clearTimeout(swipeReadyTimer.current);
        swipeReadyTimer.current = null;
      }
      if (passFx !== "vibe") setSwipeReady(false);
      return undefined;
    }
    setSwipeReady(false);
    if (reduce) {
      setSwipeReady(true);
      return undefined;
    }
    swipeReadyTimer.current = window.setTimeout(() => {
      setSwipeReady(true);
      swipeReadyTimer.current = null;
    }, VIBE_SWIPE_READY_MS);
    return () => {
      if (swipeReadyTimer.current != null) {
        window.clearTimeout(swipeReadyTimer.current);
        swipeReadyTimer.current = null;
      }
    };
  }, [scene, passFx, reduce]);

  // Banner commit → pass settle (spin); scan → film?/note?/Buzz
  useEffect(() => {
    if (scene !== "pass") return;
    if (passFx === "roll" && reduce) {
      clearTimers();
      later(() => setPassFx("spin"), 0);
      return clearTimers;
    }
    if (passFx === "scanning") {
      clearTimers();
      later(() => setPassFx("blasting"), SCAN_MS);
      return clearTimers;
    }
    if (passFx === "blasting") {
      clearTimers();
      later(() => goAfterScan(), BLAST_MS);
      return clearTimers;
    }
    return undefined;
  }, [scene, passFx, reduce, hasFilm, hasNote]);

  useEffect(() => {
    if (!filmOpen || !hasVideo) return undefined;
    const el = fullscreenVideoRef.current;
    if (!el) return undefined;
    void el.play().catch(() => undefined);
    return () => {
      el.pause();
    };
  }, [filmOpen, hasVideo]);

  useEffect(() => {
    if (!filmOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFilm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filmOpen]);

  // Receipt prints after accept, then unlock Continue → stamped
  useEffect(() => {
    if (scene !== "receipt") return;
    clearTimers();
    if (reduce) {
      setPrintReady(true);
      setPrintHint("CHECKED IN");
      return undefined;
    }
    setPrintReady(false);
    setPrintHint("Sending to printer…");
    later(() => setPrintHint("Printing your VVIP slip…"), 900);
    later(() => setPrintHint("Almost there…"), 4200);
    later(() => {
      setPrintHint("CHECKED IN");
      setPrintReady(true);
    }, PRINT_MS);
    return clearTimers;
  }, [scene, reduce]);

  const passPhase = ((): BoardingPassPhase => {
    if (passFx === "roll") return "poster";
    if (passFx === "spin") return "spin";
    if (passFx === "scanning") return "scanning";
    if (passFx === "blasting") return "blasting";
    return "poster";
  })();

  const unlockPass = () => {
    if (scene !== "pass" || passFx !== "spin") return;
    setPassFx("scanning");
  };

  const onLandingSwipeEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number }; velocity: { y: number } },
  ) => {
    if (passFx !== "vibe" || !swipeReady) return;
    if (info.offset.y <= -SWIPE_UP_PX || info.velocity.y <= SWIPE_UP_VELOCITY) {
      openPassFromLanding();
      return;
    }
    setBannerProgress(0);
  };

  const goProfileAfterAccept = async (pick: "yes" | "maybe") => {
    setRsvp(pick);
    const name = displayName.trim() || pass.guestName.trim() || "Guest";
    if (onAccept) {
      setAcceptBusy(true);
      try {
        const result = await onAccept(pick, name);
        if (result === "auth") return;
      } finally {
        setAcceptBusy(false);
      }
    }
    later(() => {
      setPrintReady(false);
      setPrintHint("Printing your VVIP slip…");
      setScene("receipt");
    }, reduce ? 0 : 420);
  };

  const enterAfterStamp = () => {
    const name = displayName.trim() || pass.guestName.trim() || "Guest";
    /** Live claim: leave the door and enter Buzz. Preview: show You're in. */
    if (onEnterEvent && !isPreview) {
      onEnterEvent(name);
      return;
    }
    setScene("in");
  };

  const onRsvp = (pick: GuestInviteRsvp) => {
    if (acceptBusy || busy) return;
    if (pick === "no") {
      setRsvp("no");
      return;
    }
    void goProfileAfterAccept(pick);
  };

  const noteBody =
    noteRaw ||
    (isPreview
      ? "We are so glad you are here. Open your invitation below."
      : "");
  const noteTitle =
    noteTitleRaw || (isPreview && !noteRaw ? "A note from the hosts" : "");

  const letterContent: InviteLetterContent = {
    ...letter,
    guestName: displayName.trim() || letter.guestName,
    welcomeTitle: noteTitle,
    welcomeMessage: noteBody,
    /**
     * Letter keeps still photos. Video stays on the film page only
     * (avoid playing twice / empty video tile on paper).
     */
    photoUrl: hasPhoto ? mediaPhoto : null,
    videoUrl: hasVideo ? mediaVideo : null,
  };

  const passContent = {
    ...pass,
    guestName: displayName.trim() || pass.guestName,
  };

  const receiptContent = {
    eventName: pass.eventName,
    guestName: displayName.trim() || pass.guestName,
    dateLine: pass.dateLine,
    venueName: pass.venueName,
    claimCode: pass.claimCode,
  };

  const sceneMotion = {
    initial: reduce ? false : ({ opacity: 0, x: 28 } as const),
    animate: { opacity: 1, x: 0 },
    exit: reduce ? undefined : ({ opacity: 0, x: -24 } as const),
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.32, ease: SCENE_EASE },
  };

  return (
    <div
      className={cn(
        "guest-invite-landing",
        vibeActive && "guest-invite-landing--vibe",
        className,
      )}
      data-mode={mode}
      data-scene={scene}
      data-pass-fx={passFx}
    >
      <div className="guest-invite-landing__bg" aria-hidden />
      <div className="guest-invite-landing__vignette" aria-hidden />

      {header}

      {isPreview ? (
        <button
          type="button"
          className="guest-invite-replay"
          onClick={restartExperience}
          aria-label="Replay invite"
        >
          Replay
        </button>
      ) : null}

      <div className="guest-invite-landing__scroll">
        <div
          className="guest-invite-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={progressTotal}
          aria-valuenow={progressIndex + 1}
          aria-label="Invite progress"
        >
          {sceneOrder.map((id, i) => (
            <span
              key={id}
              className={cn("guest-invite-progress__dot", i <= progressIndex && "is-on")}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {scene === "pass" ? (
            <motion.div
              key="pass"
              className="guest-invite-scene guest-invite-scene--pass guest-invite-stage"
              data-pass-fx={passFx}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? undefined : { opacity: 0, x: -24 }}
              transition={reduce ? { duration: 0 } : { duration: 0.28, ease: SCENE_EASE }}
            >
              {showPassObject ? (
                <motion.div
                  className={cn(
                    "guest-invite-landing__pass",
                    passFx === "roll" && "is-revealing",
                    passFx === "spin" && "is-settled",
                  )}
                  initial={false}
                  animate={{
                    opacity:
                      passFx === "spin" ||
                      passFx === "scanning" ||
                      passFx === "blasting"
                        ? 1
                        : passReveal,
                    y:
                      passFx === "spin" ||
                      passFx === "scanning" ||
                      passFx === "blasting"
                        ? 0
                        : 28 * (1 - passReveal),
                    scale:
                      passFx === "spin" ||
                      passFx === "scanning" ||
                      passFx === "blasting"
                        ? 1
                        : 0.9 + passReveal * 0.1,
                    filter:
                      passFx === "spin" ||
                      passFx === "scanning" ||
                      passFx === "blasting"
                        ? "blur(0px)"
                        : `blur(${(1 - passReveal) * 6}px)`,
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : passFx === "vibe"
                        ? { duration: 0 }
                        : SWIPE_COMMIT
                  }
                >
                  <BoardingPass
                    phase={passPhase}
                    size="hero"
                    content={passContent}
                    onOpenPass={passFx === "spin" ? unlockPass : undefined}
                  />
                </motion.div>
              ) : null}

              {showBanner ? (
                <motion.div
                  className={cn(
                    "invite-banner",
                    swipeReady && passFx === "vibe" && "is-swipeable",
                    bannerRolled && "is-rolled",
                  )}
                  drag={passFx === "vibe" && swipeReady ? "y" : false}
                  dragConstraints={
                    passFx === "vibe" ? { top: BANNER_EXIT_Y, bottom: 24 } : undefined
                  }
                  dragElastic={passFx === "vibe" ? { top: 0.04, bottom: 0.28 } : 0}
                  dragMomentum={false}
                  onDrag={(_e, info) => {
                    if (passFx === "vibe") syncBannerProgress(info.offset.y);
                  }}
                  onDragEnd={onLandingSwipeEnd}
                  whileDrag={passFx === "vibe" ? { scale: 0.995 } : undefined}
                  initial={
                    reduce
                      ? false
                      : { y: -36, opacity: 0.7, rotateX: 8, scale: 0.98 }
                  }
                  animate={
                    bannerRolled
                      ? {
                          y: BANNER_EXIT_Y,
                          opacity: 0.15,
                          rotateX: -6,
                          scale: 0.96,
                          filter: "blur(10px)",
                        }
                      : {
                          y: 0,
                          opacity: 1 - bannerProgress * 0.35,
                          rotateX: 0,
                          scale: 1,
                          filter: `blur(${bannerProgress * 4}px)`,
                        }
                  }
                  onUpdate={(latest) => {
                    if (passFx === "vibe") return;
                    if (typeof latest.y === "number") syncBannerProgress(latest.y);
                  }}
                  onAnimationComplete={() => {
                    if (passFx === "roll" && !reduce) setPassFx("spin");
                  }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : passFx === "vibe"
                        ? SWIPE_SNAP
                        : SWIPE_COMMIT
                  }
                  style={{ transformPerspective: 900 }}
                >
                  <InviteBannerCloth slowIn={passFx === "vibe"} />
                  <InviteVibeStage
                    key={vibeKey}
                    guestName={guest}
                    eventName={eventLine}
                    exiting={bannerRolled}
                  />
                  {passFx === "vibe" && swipeReady ? (
                    <button
                      type="button"
                      className="guest-invite-swipe guest-invite-swipe--on-vibe"
                      onClick={reduce ? openPassFromLanding : undefined}
                      aria-label={
                        reduce
                          ? "Open your pass"
                          : "Swipe up to roll the banner"
                      }
                    >
                      <motion.span
                        className="guest-invite-swipe__chev"
                        aria-hidden
                        animate={reduce ? undefined : { y: [0, -8, 0] }}
                        transition={
                          reduce
                            ? undefined
                            : {
                                duration: 1.25,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }
                        }
                      >
                        ↑
                      </motion.span>
                      <span className="guest-invite-swipe__label">
                        {reduce ? "Tap to open" : "Swipe up"}
                      </span>
                    </button>
                  ) : null}
                </motion.div>
              ) : null}

              {passFx === "spin" ? (
                <p className="guest-invite-landing__hint">Tap to scan your pass</p>
              ) : null}
              {passFx === "scanning" || passFx === "blasting" ? (
                <InviteScanRitual active />
              ) : null}
            </motion.div>
          ) : null}

          {scene === "receipt" ? (
            <motion.div
              key="receipt"
              className="guest-invite-scene guest-invite-receipt-scene"
              {...sceneMotion}
            >
              <p className="guest-invite-landing__hint guest-invite-landing__hint--scan">
                {printHint}
              </p>
              <InviteReceipt content={receiptContent} dispensing={!reduce} />
              {printReady ? (
                <button
                  type="button"
                  className="guest-invite-continue guest-invite-receipt-scene__cta"
                  onClick={goAfterReceipt}
                >
                  Continue
                </button>
              ) : (
                <p className="guest-invite-receipt-scene__wait" aria-hidden>
                  Hold on - your door slip is printing
                </p>
              )}
            </motion.div>
          ) : null}

          {scene === "stamped" ? (
            <motion.div
              key="stamped"
              className="guest-invite-scene guest-invite-stamped-scene"
              {...sceneMotion}
            >
              <p className="guest-invite-landing__hint guest-invite-landing__hint--scan">
                Door clearance
              </p>
              <div className="guest-invite-landing__pass is-settled">
                <BoardingPass
                  phase="stamped"
                  size="hero"
                  content={passContent}
                  stampLabel="CHECKED IN"
                />
              </div>
              <button
                type="button"
                className="guest-invite-continue"
                disabled={busy}
                onClick={enterAfterStamp}
              >
                {busy
                  ? "Opening…"
                  : onEnterEvent && !isPreview
                    ? "Enter the event"
                    : "Continue"}
              </button>
            </motion.div>
          ) : null}

          {scene === "film" && hasFilm ? (
            <motion.div
              key="film"
              className="guest-invite-scene guest-invite-film"
              {...sceneMotion}
            >
              <p className="guest-invite-film__title">A film from the hosts</p>
              <button
                type="button"
                className={cn(
                  "guest-invite-media-box guest-invite-media-box--film",
                  !filmSrc && "is-empty",
                )}
                onClick={filmSrc ? openFilm : undefined}
                disabled={!filmSrc}
                aria-label={
                  hasVideo
                    ? "Play invitation video fullscreen"
                    : hasPhoto
                      ? "Open invitation photo fullscreen"
                      : "Invitation film not added yet"
                }
              >
                {hasVideo ? (
                  <video
                    ref={videoRef}
                    className="guest-invite-media-box__media"
                    src={mediaVideo}
                    poster={mediaPhoto || undefined}
                    playsInline
                    muted
                    preload="metadata"
                    aria-hidden
                  />
                ) : hasPhoto ? (
                  <img
                    className="guest-invite-media-box__media"
                    src={mediaPhoto}
                    alt=""
                  />
                ) : (
                  <span className="guest-invite-media-box__placeholder">
                    Add a film in Invitations · Film · guests open it fullscreen here
                  </span>
                )}
                {filmSrc ? (
                  <span className="guest-invite-media-box__play" aria-hidden>
                    <span className="guest-invite-media-box__play-icon" />
                    {hasVideo ? "Tap for fullscreen" : "Tap to open"}
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                className="guest-invite-continue guest-invite-film__cta"
                onClick={goAfterFilm}
              >
                Continue
              </button>
            </motion.div>
          ) : null}

          {scene === "note" && hasNote ? (
            <motion.div
              key="note"
              className="guest-invite-scene guest-invite-note"
              {...sceneMotion}
            >
              <InviteLetterPreview
                content={letterContent}
                size="immersive"
                hideMedia={hasVideo || !hasPhoto}
                className="guest-invite-note__letter"
              />
              <button
                type="button"
                className="guest-invite-continue guest-invite-note__cta"
                onClick={() => setScene("buzzPeek")}
              >
                Continue
              </button>
            </motion.div>
          ) : null}

          {scene === "buzzPeek" ? (
            <motion.div
              key="buzzPeek"
              className="guest-invite-scene guest-invite-buzz-peek-scene"
              {...sceneMotion}
            >
              <InviteBuzzPeek
                content={{
                  ...peekContent,
                  guestName: displayName || peekContent.guestName,
                }}
                onContinue={goAfterPeek}
              />
            </motion.div>
          ) : null}

          {scene === "rsvp" ? (
            <motion.div
              key="rsvp"
              className="guest-invite-scene guest-invite-rsvp-scene"
              {...sceneMotion}
            >
              {rsvp !== "no" ? (
                <div className="guest-invite-panel guest-invite-panel--solo">
                  <p className="guest-invite-panel__lede">Will you be there?</p>
                  <div className="guest-invite-rsvp">
                    {(["yes", "maybe", "no"] as const).map((pick) => (
                      <button
                        key={pick}
                        type="button"
                        data-rsvp={pick}
                        className={cn(rsvp === pick && "is-on")}
                        disabled={acceptBusy || busy}
                        onClick={() => onRsvp(pick)}
                      >
                        {pick === "yes" ? "Yes" : pick === "maybe" ? "Maybe" : "Can't"}
                      </button>
                    ))}
                  </div>
                  <p className="guest-invite-panel__hint">
                    {rsvp ? RSVP_HINT[rsvp] : "One tap for the hosts."}
                  </p>
                </div>
              ) : (
                <div className="guest-invite-decline">
                  <p>Thanks for letting us know.</p>
                  <small>You're all set. Nothing else to save.</small>
                </div>
              )}
            </motion.div>
          ) : null}

          {scene === "in" ? (
            <motion.div
              key="in"
              className="guest-invite-scene guest-invite-fomo"
              {...sceneMotion}
            >
              <p className="guest-invite-fomo__eyebrow">Checked in · almost there</p>
              <h2 className="guest-invite-fomo__title">
                The night moves in the app.
              </h2>
              <p className="guest-invite-fomo__hook">
                Live Buzz, Plot changes, seat pings, and the games board only fire
                for guests who open BiyeFlow.
              </p>

              <ul className="guest-invite-fomo__locks">
                <li>
                  <span aria-hidden>◆</span>
                  Live Buzz drops while you wait
                </li>
                <li>
                  <span aria-hidden>◆</span>
                  Plot &amp; timing shifts the second hosts update
                </li>
                <li>
                  <span aria-hidden>◆</span>
                  Your pass + night-of board, not a screenshot
                </li>
              </ul>

              <label className="guest-invite-fomo__label" htmlFor="guest-display-name">
                Name on the guest wall
              </label>
              <input
                id="guest-display-name"
                className="guest-invite-fomo__input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={48}
                autoComplete="nickname"
              />

              <div className="guest-invite-fomo__actions">
                <button
                  type="button"
                  className="guest-invite-cta guest-invite-cta--cream guest-invite-fomo__primary"
                  disabled={!displayName.trim()}
                  onClick={() => setStoresOpen(true)}
                >
                  Get BiyeFlow — don&apos;t miss it
                </button>
                <button
                  type="button"
                  className="guest-invite-cta guest-invite-cta--ghost"
                  disabled={busy || !displayName.trim()}
                  onClick={() =>
                    onContinueBrowser?.(
                      displayName.trim() || pass.guestName.trim() || "Guest",
                    )
                  }
                >
                  {busy ? "Opening…" : "Browser · limited access"}
                </button>
              </div>
              <p className="guest-invite-fomo__warn">
                {isPreview
                  ? "Preview. Store taps and Continue won’t hand you into Buzz."
                  : "Browser guests miss live drops. The app is where the night happens."}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {filmOpen && (hasVideo || hasPhoto) ? (
          <motion.div
            className="guest-invite-media-fs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={hasVideo ? "Invitation video" : "Invitation photo"}
          >
            <button
              type="button"
              className="guest-invite-media-fs__scrim"
              aria-label="Close"
              onClick={closeFilm}
            />
            <div className="guest-invite-media-fs__stage">
              {hasVideo ? (
                <video
                  ref={fullscreenVideoRef}
                  className="guest-invite-media-fs__media"
                  src={mediaVideo}
                  poster={mediaPhoto || undefined}
                  playsInline
                  controls
                  autoPlay
                  preload="auto"
                />
              ) : (
                <img
                  className="guest-invite-media-fs__media"
                  src={mediaPhoto}
                  alt="From the hosts"
                />
              )}
            </div>
            <button
              type="button"
              className="guest-invite-media-fs__close"
              onClick={closeFilm}
            >
              Close
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {storesOpen ? (
          <motion.div
            className="guest-invite-sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              className="guest-invite-sheet__scrim"
              aria-label="Close"
              onClick={() => setStoresOpen(false)}
            />
            <motion.div
              className="guest-invite-sheet__panel"
              initial={reduce ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={reduce ? undefined : { y: "100%" }}
              transition={SPRING}
              role="dialog"
              aria-label="Get the app"
            >
              <div className="guest-invite-sheet__handle" aria-hidden />
              <p className="guest-invite-sheet__title">Don&apos;t watch from outside</p>
              <p className="guest-invite-sheet__tag">
                Install BiyeFlow now — Buzz, Plots, and your pass update live. Miss
                the app, miss the drops.
              </p>
              <div className="guest-invite-brand__stores">
                <button
                  type="button"
                  className="guest-invite-store"
                  onClick={() => onStoreTap?.("apple")}
                >
                  <span className="guest-invite-store__icon" aria-hidden>
                    <StoreAppleIcon />
                  </span>
                  <span>
                    <small>Download on the</small>
                    <strong>App Store</strong>
                  </span>
                </button>
                <button
                  type="button"
                  className="guest-invite-store"
                  onClick={() => onStoreTap?.("google")}
                >
                  <span className="guest-invite-store__icon guest-invite-store__icon--play" aria-hidden>
                    <StorePlayIcon />
                  </span>
                  <span>
                    <small>Get it on</small>
                    <strong>Google Play</strong>
                  </span>
                </button>
              </div>
              <button
                type="button"
                className="guest-invite-cta guest-invite-cta--ghost"
                onClick={() => setStoresOpen(false)}
              >
                Close
              </button>
              <p className="guest-invite-brand__note">
                {isPreview
                  ? "Preview. Store taps won't install anything."
                  : "Your accept is already with the hosts."}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
