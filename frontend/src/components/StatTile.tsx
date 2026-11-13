import FlipValue from "./FlipValue";
import CountUp from "./CountUp";

interface StatTileProps {
  label: string;
  value: string | number;
  accent?: "default" | "amber" | "red" | "green" | "cyan" | "purple";
}

// Full fills from the site-wide loud palette (the same five hex values
// used for every other card: sidebar, auth, Cameras, Video Library,
// Incidents, Analytics, Performance, Audit Logs). Card color is purely
// decorative/positional here, same as everywhere else it's used --
// severity still reads off the status-tinted badges elsewhere (incident
// priority pills, activity-log tags), never off this fill.
const accentBg: Record<string, string> = {
  default: "bg-loud-indigo/80",
  amber: "bg-loud-lime/55",
  red: "bg-loud-magenta/80",
  green: "bg-loud-jade/55",
  cyan: "bg-loud-indigo/80",
  purple: "bg-loud-violet/60",
};

// Ink flips with each fill's lightness: white on the dark fills
// (indigo/magenta both alias to black, violet is dark enough too),
// black on the bright lime/jade fills.
const accentInk: Record<string, { label: string; value: string }> = {
  default: { label: "text-white/70", value: "text-white" },
  amber: { label: "text-black/60", value: "text-black" },
  red: { label: "text-white/70", value: "text-white" },
  green: { label: "text-black/60", value: "text-black" },
  cyan: { label: "text-white/70", value: "text-white" },
  purple: { label: "text-white/70", value: "text-white" },
};

export default function StatTile({ label, value, accent = "default" }: StatTileProps) {
  const ink = accentInk[accent];
  return (
    <div className={`vivid-card px-5 py-4 overflow-hidden ${accentBg[accent]}`}>
      <p className={`text-[13px] tracking-[-0.01em] mb-1.5 ${ink.label}`}>{label}</p>
      <p className={`tabular text-[1.8rem] font-medium leading-none tracking-[-0.04em] ${ink.value}`}>
        {typeof value === "number" ? <CountUp value={value} /> : <FlipValue value={value} />}
      </p>
    </div>
  );
}
