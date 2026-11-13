import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { ActivityEvent, EventSeverity } from "../types";

export const severityStyle: Record<EventSeverity, string> = {
  critical: "text-red-50 border-status-critical/50 bg-status-critical/25 font-bold",
  high: "text-orange-50 border-status-high/50 bg-status-high/25",
  medium: "text-amber-50 border-status-medium/50 bg-status-medium/25",
  // Entries sit on vivid, varied card colors now (not a fixed dark
  // ground), so "low" reads off a translucent white overlay instead of a
  // status hue tuned for one specific background.
  low: "text-white/80 border-white/20 bg-white/10",
};

// Three-letter mono tags, not a borrowed icon glyph: the craft floor
// bans unicode/emoji standing in for icons, and these read as labels the
// tracking_pipeline's own event_type already names, not pictograms.
const eventTypeTag: Record<string, string> = {
  weapon: "WPN",
  anomaly: "ANM",
  escalation: "ESC",
  status: "OK",
};

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface ActivityLogProps {
  events: ActivityEvent[];
  emptyMessage: string;
  logEndRef?: React.Ref<HTMLDivElement>;
}

export default function ActivityLog({ events, emptyMessage, logEndRef }: ActivityLogProps) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
      {events.length === 0 && <p className="text-sm text-white/70">{emptyMessage}</p>}
      <AnimatePresence initial={false}>
      {events.map((e) => (
        <motion.div
          key={e.id}
          layout={!reduceMotion}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`rounded-xl border px-2.5 py-1.5 text-xs ${severityStyle[e.severity]}`}>
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-mono tabular text-white/60">{formatClock(e.timestamp_seconds)}</span>
            <span className="text-[10px] opacity-80 font-medium">
              {eventTypeTag[e.event_type] ?? "OK"} / {e.severity}
            </span>
          </div>
          <p className="leading-snug">{e.description}</p>
        </motion.div>
      ))}
      </AnimatePresence>
      {logEndRef && <div ref={logEndRef} />}
    </div>
  );
}
