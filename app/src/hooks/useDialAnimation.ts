import { useEffect, useRef } from "react";

export function useDialAnimation(percentage: number, delay = 300) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) return;

    const length = circle.getTotalLength();
    circle.style.strokeDasharray = `${length}`;
    circle.style.strokeDashoffset = `${length}`;

    const timer = window.setTimeout(() => {
      const pct = Math.min(100, Math.max(0, percentage)) / 100;
      circle.style.transition = "stroke-dashoffset 1.5s ease-out";
      circle.style.strokeDashoffset = `${length * (1 - pct)}`;
    }, delay);

    return () => window.clearTimeout(timer);
  }, [percentage, delay]);

  return circleRef;
}
