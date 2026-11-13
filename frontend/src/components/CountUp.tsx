import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function formatWithCommas(n: number) {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Counts up from 0 to `value` once the tile scrolls into view, so the
 * number never plays off-screen before an operator has a chance to see it.
 */
export default function CountUp({ value, duration = 2000, className = "" }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);
  const frameRef = useRef<number>();

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            setDisplay(value * easeOutQuad(progress));
            if (progress < 1) {
              frameRef.current = requestAnimationFrame(tick);
            } else {
              setDisplay(value);
            }
          };

          frameRef.current = requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span ref={elementRef} className={className}>
      {formatWithCommas(display)}
    </span>
  );
}
