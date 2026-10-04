import { useEffect, useRef, useState, type ReactNode } from "react";
import { useWeddingState } from "../../hooks/useWeddingState";
import { Icon } from "../ui/Icon";
import { cn } from "../../design-system/cn";

const PULL_THRESHOLD = 56;
const BUSY_GAP = 52;

export function PullToRefresh({ children }: { children: ReactNode }) {
  const { refreshFromCloud, syncCode } = useWeddingState();
  const startY = useRef(0);
  const pulling = useRef(false);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      if (busy) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('[role="dialog"], input, textarea, select, label')) return;
      if (target?.closest("button, a, [role=\"button\"]")) return;
      let node = target instanceof HTMLElement ? target : null;
      while (node && node !== document.body) {
        if (node.scrollHeight - node.clientHeight > 8 && node.scrollTop > 4) return;
        node = node.parentElement;
      }
      if ((document.scrollingElement?.scrollTop || window.scrollY || 0) > 4) return;
      pulling.current = true;
      startY.current = event.touches[0].clientY;
    };

    const onMove = (event: TouchEvent) => {
      if (!pulling.current || busy) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta < 12) {
        if (offsetRef.current !== 0) {
          offsetRef.current = 0;
          setOffset(0);
        }
        return;
      }
      const next = Math.min(88, (delta - 12) * 0.5);
      offsetRef.current = next;
      setOffset(next);
    };

    const onEnd = () => {
      if (!pulling.current) return;
      pulling.current = false;
      const pulled = offsetRef.current;
      if (pulled < PULL_THRESHOLD) {
        offsetRef.current = 0;
        setOffset(0);
        return;
      }

      setBusy(true);
      setOffset(BUSY_GAP);
      offsetRef.current = BUSY_GAP;

      const work = syncCode ? refreshFromCloud(true) : Promise.resolve();
      void work.finally(() => {
          window.setTimeout(() => {
            setBusy(false);
            offsetRef.current = 0;
            setOffset(0);
          }, 280);
        });
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [busy, refreshFromCloud, syncCode]);

  const gap = busy ? BUSY_GAP : offset;

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        className="lg:hidden overflow-hidden flex items-center justify-center shrink-0"
        style={{
          height: gap,
          transition: pulling.current ? "none" : "height 220ms ease",
        }}
        aria-hidden
      >
        {gap > 8 ? (
          <Icon
            name="refresh"
            className={cn(
              "text-[22px] text-black",
              busy ? "ptr-icon-spin" : "",
            )}
            filled={false}
          />
        ) : null}
      </div>
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
