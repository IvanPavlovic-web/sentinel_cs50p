import { useEffect, useRef, useState } from "react";

interface FlipValueProps {
  value: string | number;
  className?: string;
}

/**
 * The signature move: when a live value actually changes (a risk score,
 * a status word, a progress percent), it settles into its new reading
 * with a soft spring pop instead of silently swapping underneath the
 * operator. Re-keying the span on change retriggers the CSS animation,
 * so this only plays on a real data transition, never on every render.
 */
export default function FlipValue({ value, className = "" }: FlipValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [flipKey, setFlipKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDisplayValue(value);
      setFlipKey((k) => k + 1);
    }
  }, [value]);

  return (
    <span key={flipKey} className={`inline-block animate-pop ${className}`}>
      {displayValue}
    </span>
  );
}
