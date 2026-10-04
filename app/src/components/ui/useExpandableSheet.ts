import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export type ExpandableSheetSnap = "mid" | "expanded";

type ViewportBox = { top: number; height: number };

type UseExpandableSheetOptions = {
  open: boolean;
  onClose: () => void;
  /** Fraction of viewport for mid snap (default 0.7). */
  midRatio?: number;
  /** Fraction of viewport for expanded snap (default 0.93). */
  expandedRatio?: number;
  /** First snap when the sheet opens (default mid). */
  initialSnap?: ExpandableSheetSnap;
};

type DragState = {
  pointerId: number;
  startY: number;
  startHeight: number;
  lastY: number;
  lastTs: number;
  velocity: number;
  moved: boolean;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readViewport(): ViewportBox {
  const viewport = window.visualViewport;
  if (!viewport) return { top: 0, height: window.innerHeight };
  return { top: viewport.offsetTop, height: viewport.height };
}

function snapHeights(viewportHeight: number, midRatio: number, expandedRatio: number) {
  const mid = Math.round(viewportHeight * midRatio);
  const expanded = Math.round(viewportHeight * expandedRatio);
  return {
    mid: Math.max(280, Math.min(mid, viewportHeight - 24)),
    expanded: Math.max(320, Math.min(expanded, viewportHeight - 8)),
  };
}

/**
 * iOS Maps–style expandable bottom sheet:
 * Mid ↔ Expanded via drag on handle/header, or tap grabber.
 * Dismiss by dragging down from Mid (or strong flick from Expanded).
 */
export function useExpandableSheet({
  open,
  onClose,
  midRatio = 0.7,
  expandedRatio = 0.93,
  initialSnap = "mid",
}: UseExpandableSheetOptions) {
  const [viewportBox, setViewportBox] = useState<ViewportBox>({ top: 0, height: 0 });
  const [snap, setSnap] = useState<ExpandableSheetSnap>(initialSnap);
  const [height, setHeight] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const snapRef = useRef(snap);
  snapRef.current = snap;
  const heightRef = useRef(height);
  heightRef.current = height;
  const dragRef = useRef<DragState | null>(null);
  const reduceMotionRef = useRef(false);

  const snapsFor = useCallback(
    (vh: number) => snapHeights(vh, midRatio, expandedRatio),
    [midRatio, expandedRatio],
  );

  useEffect(() => {
    if (!open) {
      setSnap(initialSnap);
      snapRef.current = initialSnap;
      setHeight(0);
      setDragging(false);
      setViewportBox({ top: 0, height: 0 });
      dragRef.current = null;
      return;
    }

    reduceMotionRef.current = prefersReducedMotion();

    const sync = () => {
      const box = readViewport();
      setViewportBox(box);
      const snaps = snapsFor(box.height || window.innerHeight);
      const next = snapRef.current === "expanded" ? snaps.expanded : snaps.mid;
      if (!dragRef.current) {
        setHeight(next);
        heightRef.current = next;
      }
    };

    sync();
    const viewport = window.visualViewport;
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [open, snapsFor, initialSnap]);

  const applySnap = useCallback(
    (next: ExpandableSheetSnap) => {
      const vh = viewportBox.height || window.innerHeight;
      const snaps = snapsFor(vh);
      const target = next === "expanded" ? snaps.expanded : snaps.mid;
      setSnap(next);
      snapRef.current = next;
      setHeight(target);
      heightRef.current = target;
    },
    [snapsFor, viewportBox.height],
  );

  const toggleExpanded = useCallback(() => {
    applySnap(snapRef.current === "expanded" ? "mid" : "expanded");
  }, [applySnap]);

  const settleFromDrag = useCallback(
    (currentHeight: number, velocity: number) => {
      const vh = viewportBox.height || window.innerHeight;
      const snaps = snapsFor(vh);
      const mid = snaps.mid;
      const expanded = snaps.expanded;
      const flickDown = velocity > 0.65;
      const flickUp = velocity < -0.65;

      if (flickDown) {
        if (snapRef.current === "expanded" && currentHeight > mid * 0.85) {
          applySnap("mid");
          return;
        }
        onCloseRef.current();
        return;
      }

      if (flickUp) {
        applySnap("expanded");
        return;
      }

      if (currentHeight < mid * 0.62) {
        onCloseRef.current();
        return;
      }

      const midDist = Math.abs(currentHeight - mid);
      const expDist = Math.abs(currentHeight - expanded);
      applySnap(expDist < midDist ? "expanded" : "mid");
    },
    [applySnap, snapsFor, viewportBox.height],
  );

  const onHandlePointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    const now = performance.now();
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: heightRef.current,
      lastY: event.clientY,
      lastTs: now,
      velocity: 0,
      moved: false,
    };
    setDragging(true);
  }, []);

  const onHandlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;

      const vh = viewportBox.height || window.innerHeight;
      const snaps = snapsFor(vh);
      const deltaY = event.clientY - drag.startY;
      if (Math.abs(deltaY) > 4) drag.moved = true;

      /* Finger up → taller sheet; finger down → shorter. */
      let next = drag.startHeight - deltaY;
      const max = snaps.expanded + 28;
      const min = snaps.mid * 0.35;
      if (next > snaps.expanded) {
        const over = next - snaps.expanded;
        next = snaps.expanded + over * 0.22;
      }
      next = Math.max(min, Math.min(max, next));

      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTs);
      drag.velocity = (event.clientY - drag.lastY) / dt;
      drag.lastY = event.clientY;
      drag.lastTs = now;

      heightRef.current = next;
      setHeight(next);
    },
    [snapsFor, viewportBox.height],
  );

  const onHandlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>, { allowTapToggle }: { allowTapToggle: boolean }) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      dragRef.current = null;
      setDragging(false);

      if (!drag.moved) {
        if (allowTapToggle) toggleExpanded();
        else applySnap(snapRef.current);
        return;
      }
      settleFromDrag(heightRef.current, drag.velocity);
    },
    [applySnap, settleFromDrag, toggleExpanded],
  );

  const onHandlePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDragging(false);
      settleFromDrag(heightRef.current, 0);
    },
    [settleFromDrag],
  );

  const makeBind = useCallback(
    (allowTapToggle: boolean) => ({
      onPointerDown: onHandlePointerDown,
      onPointerMove: onHandlePointerMove,
      onPointerUp: (event: ReactPointerEvent<HTMLElement>) =>
        onHandlePointerUp(event, { allowTapToggle }),
      onPointerCancel: onHandlePointerCancel,
    }),
    [onHandlePointerCancel, onHandlePointerDown, onHandlePointerMove, onHandlePointerUp],
  );

  const backdropOpacity =
    viewportBox.height > 0
      ? Math.min(0.55, 0.32 + (height / viewportBox.height) * 0.28)
      : 0.45;

  return {
    viewportBox,
    snap,
    expanded: snap === "expanded",
    height,
    dragging,
    reduceMotion: reduceMotionRef.current,
    backdropOpacity,
    toggleExpanded,
    applySnap,
    /** Grabber: drag + tap to toggle Mid/Expanded */
    handleBind: makeBind(true),
    /** Header chrome: drag only (buttons should stopPropagation) */
    chromeBind: makeBind(false),
  };
}
