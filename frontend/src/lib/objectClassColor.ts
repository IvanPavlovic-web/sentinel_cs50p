// Purely categorical color per detected object class -- never a severity
// signal (that stays on the reserved status ramp). Literal class strings,
// not a template, so Tailwind's static scan actually picks them up.
const CLASS_CHIP: Record<string, string> = {
  person: "text-vivid-cyan border-vivid-cyan/40 bg-vivid-cyan/15",
  car: "text-vivid-blue border-vivid-blue/40 bg-vivid-blue/15",
  truck: "text-vivid-purple border-vivid-purple/40 bg-vivid-purple/15",
  motorcycle: "text-vivid-pink border-vivid-pink/40 bg-vivid-pink/15",
  bus: "text-vivid-amber border-vivid-amber/40 bg-vivid-amber/15",
  knife: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  gun: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  pistol: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  rifle: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  weapon: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  firearm: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  grenade: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
  missile: "text-vivid-orange border-vivid-orange/40 bg-vivid-orange/15",
};

const CLASS_TEXT: Record<string, string> = {
  person: "text-vivid-cyan",
  car: "text-vivid-blue",
  truck: "text-vivid-purple",
  motorcycle: "text-vivid-pink",
  bus: "text-vivid-amber",
  knife: "text-vivid-orange",
  gun: "text-vivid-orange",
  pistol: "text-vivid-orange",
  rifle: "text-vivid-orange",
  weapon: "text-vivid-orange",
  firearm: "text-vivid-orange",
  grenade: "text-vivid-orange",
  missile: "text-vivid-orange",
};

const CLASS_DOT: Record<string, string> = {
  person: "bg-vivid-cyan",
  car: "bg-vivid-blue",
  truck: "bg-vivid-purple",
  motorcycle: "bg-vivid-pink",
  bus: "bg-vivid-amber",
  knife: "bg-vivid-orange",
  gun: "bg-vivid-orange",
  pistol: "bg-vivid-orange",
  rifle: "bg-vivid-orange",
  weapon: "bg-vivid-orange",
  firearm: "bg-vivid-orange",
  grenade: "bg-vivid-orange",
  missile: "bg-vivid-orange",
};

const FALLBACK_CHIP = "text-vivid-green border-vivid-green/40 bg-vivid-green/15";
const FALLBACK_TEXT = "text-vivid-green";
const FALLBACK_DOT = "bg-vivid-green";

/** Full chip treatment: tinted background + tinted border + colored text. */
export function objectClassChip(objectClass: string): string {
  return CLASS_CHIP[objectClass.toLowerCase()] ?? FALLBACK_CHIP;
}

export function objectClassColor(objectClass: string): string {
  return CLASS_TEXT[objectClass.toLowerCase()] ?? FALLBACK_TEXT;
}

export function objectClassDot(objectClass: string): string {
  return CLASS_DOT[objectClass.toLowerCase()] ?? FALLBACK_DOT;
}

// For identities with no fixed category (cameras, generic series), cycle
// through the same vivid palette by position instead of by name.
const CYCLE_TEXT = [
  "text-vivid-cyan",
  "text-vivid-purple",
  "text-vivid-pink",
  "text-vivid-amber",
  "text-vivid-green",
  "text-vivid-blue",
  "text-vivid-orange",
];
const CYCLE_DOT = [
  "bg-vivid-cyan",
  "bg-vivid-purple",
  "bg-vivid-pink",
  "bg-vivid-amber",
  "bg-vivid-green",
  "bg-vivid-blue",
  "bg-vivid-orange",
];

export function cycleColor(index: number): string {
  return CYCLE_TEXT[index % CYCLE_TEXT.length];
}

export function cycleDot(index: number): string {
  return CYCLE_DOT[index % CYCLE_DOT.length];
}
