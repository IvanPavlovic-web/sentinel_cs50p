function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5z" />
    </svg>
  );
}

interface GlitchWordmarkProps {
  iconClassName?: string;
  textClassName?: string;
  subtitle?: string;
  gap?: string;
}

// The brand mark (shield + "SentinelAI"), with a heavy, bursty
// channel-split glitch: the readable base layer never moves or
// disappears, while two duplicate copies -- tinted from the app's own
// loud palette instead of literal red/green/blue -- flash in on a
// clipped horizontal band every few seconds, each on its own offset
// timing so the split reads as chaotic rather than one block sliding.
// Fully CSS: see .glitch-* keyframes in index.css. Respects
// prefers-reduced-motion (the glitch layers stay inert; only the
// static wordmark shows).
export default function GlitchWordmark({ iconClassName = "w-6 h-6", textClassName = "text-xl", subtitle, gap = "gap-2.5" }: GlitchWordmarkProps) {
  return (
    <div className={`glitch-wordmark relative inline-flex items-center ${gap}`}>
      <span className={`glitch-base relative z-10 inline-flex items-center ${gap}`}>
        <ShieldIcon className={`${iconClassName} text-ops-accent shrink-0`} />
        <span className="min-w-0">
          <span className={`font-display font-semibold tracking-tight leading-none block ${textClassName}`}>SentinelAI</span>
          {subtitle && <span className="block text-xs text-ops-muted mt-1">{subtitle}</span>}
        </span>
      </span>

      <span aria-hidden="true" className={`glitch-layer glitch-layer-indigo absolute inset-0 inline-flex items-center ${gap}`}>
        <ShieldIcon className={`${iconClassName} shrink-0`} />
        <span className={`font-display font-semibold tracking-tight leading-none ${textClassName}`}>SentinelAI</span>
      </span>
      <span aria-hidden="true" className={`glitch-layer glitch-layer-magenta absolute inset-0 inline-flex items-center ${gap}`}>
        <ShieldIcon className={`${iconClassName} shrink-0`} />
        <span className={`font-display font-semibold tracking-tight leading-none ${textClassName}`}>SentinelAI</span>
      </span>
      <span aria-hidden="true" className={`glitch-layer glitch-layer-lime absolute inset-0 inline-flex items-center ${gap}`}>
        <ShieldIcon className={`${iconClassName} shrink-0`} />
        <span className={`font-display font-semibold tracking-tight leading-none ${textClassName}`}>SentinelAI</span>
      </span>
    </div>
  );
}
