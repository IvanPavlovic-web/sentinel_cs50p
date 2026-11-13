---
name: SentinelAI
description: A calm, material operations console — Apple-inspired depth and spring motion fused with the product's own Risk severity palette.
colors:
  ops-bg: "#0a0b0d"
  ops-panel: "#14161b"
  ops-panel2: "#0e1013"
  ops-border: "#262a31"
  ops-borderStrong: "#3d434d"
  ops-accent: "#f4f1ea"
  ops-accentDim: "#c9c4b7"
  ops-muted: "#9099a6"
  status-critical: "#ef4444"
  status-high: "#f97316"
  status-medium: "#f5c518"
  status-low: "#8b93a1"
  status-ok: "#22c55e"
typography:
  display:
    fontFamily: "\"Geist\", system-ui, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.01em"
  body:
    fontFamily: "\"Geist\", system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "\"Geist\", system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
  mono:
    fontFamily: "\"Geist Mono\", ui-monospace, monospace"
    fontSize: "0.875rem"
    fontFeature: "tnum 1"
rounded:
  control: "0.75rem"
  panel: "1.25rem"
  sheet: "1.5rem"
  pill: "9999px"
spacing:
  sm: "0.5rem"
  md: "0.875rem"
  lg: "1.25rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.ops-accent}"
    textColor: "{colors.ops-bg}"
    typography: "{typography.display}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.ops-accentDim}"
  panel:
    backgroundColor: "rgba(20,22,27,0.62)"
    rounded: "{rounded.panel}"
    padding: "20px"
  input:
    backgroundColor: "{colors.ops-panel2}"
    textColor: "{colors.ops-accent}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
---

# Design System: SentinelAI

## Overview

**Creative North Star: "Calm Material"**

SentinelAI reads as a considered, physical operating surface — Apple's own system materiality (translucent layered panels, generous space, soft deep shadow, a natural spring settle) fused with the product's existing Risk severity semantics, not Apple's brand, logo, or screens. The ground stays dark — the honest choice for a console watched in operations rooms and at night, not a style pick — but panels are no longer flat fills with a hairline border: they are translucent material (`backdrop-filter: blur`) over the ground, with soft multi-stop shadow and large, consistent corner radii. One calm, neutral grotesk (Geist) carries every text role at every weight; there is no condensed display face, no uppercase tracked labels. Hierarchy comes from size, weight, and space, never shouting. Geist Mono stays reserved for genuinely tabular data. State color — the existing reserved severity ramp (critical/high/medium/low/ok) — is unchanged: this redesign changes material and motion, not the product's meaning-bearing colors.

This is the third visual world this project has carried. The original black/white/gray console (Inter + Space Grotesk, no accent hue) and a split-flap "Live Board" world (condensed caps, flat 0px panels, a mechanical flip) both shipped, were polished and audited, and were then explicitly superseded by later redesign briefs — both now exist only as evidence/anti-reference, never as constraints on this one.

The system's reusable signature is the spring settle: a live-updating value re-keys and plays a soft scale-and-fade pop (`animate-pop`) whenever its underlying data actually changes, and a material sheet (a dialog, the mobile nav drawer) enters with the same calm settle (`animate-sheetIn`) rather than snapping or sliding flatly into place. Every control shares one tactile baseline, a gentle press-and-release (`.press`), reusing the same easing. Both the settle and the press use a smooth exponential ease-out curve (`cubic-bezier(0.16,1,0.3,1)`), not an elastic/bounce curve — real decelerating objects don't wobble, and a hard overshoot reads as dated rather than physical.

**Key Characteristics:**
- Dark anthracite ground; panels are translucent, blurred material with soft layered shadow, never a flat fill-plus-hairline standing in for depth.
- One calm grotesk (Geist) for every text role, no condensed caps, no heavy tracking; monospace reserved strictly for tabular data.
- Large, consistent corner radii (1.25rem panels, 1.5rem sheets, 0.75rem controls) replace the previous flat 0px board segments.
- State color (red/amber/yellow/slate/green) appears only on real severity or status, never as decoration — unchanged across all three visual worlds this project has had.
- The spring settle (`animate-pop` / `animate-sheetIn`) plus the shared `.press` tactile baseline are the one motion language, with a true `prefers-reduced-motion` fallback that keeps functional feedback (the loading spinner) running at full speed and only swaps the decorative entrances for a brief fade.

## Colors

The palette is unchanged in value from the prior world — a near-black anthracite ground with a warm off-white accent and the five-step severity ramp — because this redesign's brief was material and motion, not the product's color meaning. What changed is how color is applied: as translucent material tints rather than flat fills.

### Primary
- **Warm Off-White** (`#f4f1ea`, `ops-accent`): the single non-status accent — active nav fill, primary button fill, headline text, focus outline, text selection, the ambient glow behind the auth screen's card. Reduced opacity (`ops-accentDim`, `#c9c4b7`) for hover states.

### Neutral
- **Void Ground** (`#0a0b0d`, `ops-bg`): page background, never pure `#000`.
- **Panel** (`#14161b`, `ops-panel`): the base tone panels tint from at ~62% alpha behind a blur (see `.panel-material`), not a flat fill.
- **Panel Recessed** (`#0e1013`, `ops-panel2`): input fields, table header rows, nested chips.
- **Hairline Border** (`#262a31`, `ops-border`): table row dividers and other non-material borders that aren't part of a glass panel's own edge.
- **Strong Border** (`#3d434d`, `ops-borderStrong`): default-state status dots, scrollbar thumb.
- **Muted Text** (`#9099a6`, `ops-muted`): secondary/placeholder text, calibrated for ≥4.5:1 on this palette — never Tailwind's default `slate-500`/`slate-600`, both of which fall under that.

### Status (severity ramp — reserved, never decorative)
- **Critical Red** (`#ef4444`), **High Amber-Orange** (`#f97316`), **Medium Amber-Yellow** (`#f5c518`), **Low Slate** (`#8b93a1`), **Ok Green** (`#22c55e`) — unchanged meanings: incident priority, zone severity, connection/session state.

### Named Rules
**The Reserved State Rule.** Status colors render only on a real severity, priority, or connection-state value — never as a page accent, chart decoration, or brand color.
**The One Palette Rule.** Every color reference — including raw hex passed to SVG/Recharts props, which can't take a Tailwind class — resolves to a documented token. A zone dot, chart line, or draw-preview outline never invents a one-off color; the in-progress zone-draw preview uses `ops-accent`, not a decorative hue.

**Named exception — the ambient background and the `vivid` palette.** `AnimatedGradientBackground` (frontend/src/components/ui/animated-gradient-background.tsx), rendered behind the full app shell (`Layout.tsx`) and both auth screens, is a deliberate, explicit exception to this rule: a multi-hue animated radial gradient, requested by name and confirmed after being flagged against this exact rule and against the earlier "no generic SaaS gradient" brief. Its colors (and the `vivid.*` Tailwind tokens: cyan/blue/purple/pink/amber/orange/green/emerald) were later updated to match a second reference component the user pasted, so the gradient and the categorical object-class chip colors (`frontend/src/lib/objectClassColor.ts` — person/car/truck/etc., Analytics + CameraDetail + VideoDetail) share one palette. `vivid.*` is purely categorical color, never severity: it must never be applied to a status/priority/risk value, which stays on the reserved ramp above. Do not "fix" either back to the reserved palette or remove the category coloring in a future pass without the user raising it again.
**The Accessible Muted Text Rule.** Secondary text always resolves to `ops-muted`, never `slate-500`/`slate-600`.

## Typography

**Every role:** "Geist" (with system-ui, sans-serif fallback) — chosen deliberately over the more common AI-generated-UI defaults (Inter, Geist, Plus Jakarta Sans, Space Grotesk, etc.): a calm, humanist/geometric grotesk close in proportion to a system UI face, which fits "Apple-inspired" honestly without copying Apple's own typeface license.
**Tabular/measured data only:** "Geist Mono" (tabular figures) — risk scores, timestamps, counts, IDs, the sidebar clock.

### Hierarchy
- **Display** (600, 1.6rem–2.5rem responsive clamp, tight tracking, no uppercase): page `<h1>` via `PageHeader`, the incident dialog title, auth screen headlines.
- **Brand wordmark** (600, text-xl/2xl, tight tracking): "SentinelAI" in the sidebar and auth screens — mixed case, not a logotype treatment.
- **Section label** (500–600, text-sm, normal case): panel sub-headings ("Cameras", "Live Board — Recent Incidents"), replacing the prior world's tiny tracked uppercase caps.
- **Table/column label** (500, text-xs, `ops-muted`, normal case): table column headers, stat-tile labels.
- **Body** (400, 0.875rem, Geist): form labels, descriptive copy, non-numeric table text.
- **Mono/Tabular** (400–500, 0.875rem, tabular-nums, Geist Mono): risk scores, timestamps, IDs, clock, counts.

### Named Rules
**The No-Caps Rule.** No text role in this world uses `uppercase` or heavy letter-tracking; hierarchy is carried by size, weight, and space. Badges/chips use `capitalize` on their underlying data value instead (e.g. a priority renders "Critical", not "CRITICAL" or "critical").

**Named exception — Geist.** The typeface is Geist + Geist Mono, named explicitly by the user from a reference component. Both are flagged by this project's design-quality detector as "overused AI-generated-UI" faces (the same list that includes Inter); kept anyway because the user named it directly, twice, after being told. Do not "fix" it to a different face in a future pass without the user raising it again.
**The Tabular-Only Mono Rule.** Monospace is reserved for genuinely measured/tabular values. It is never used for prose, labels, or decoration.

## Layout

Desktop (`lg` and up): a persistent 288px (`w-72`) sidebar built as chrome material (`.chrome-material` — blurred, tinted, no corner radius since it's flush to the viewport edge) and a scrollable main region capped at `max-w-7xl`, `px-4 sm:px-6 py-6`. Page content stacks with generous vertical rhythm (`space-y-8`). Below `lg`, the sidebar is replaced by a sticky chrome-material top bar and an off-canvas drawer built as a floating sheet (`.sheet-material.drawer-sheet`, rounded only on its free edge) that springs in (`animate-sheetIn`) over a blurred backdrop, closes on Escape, backdrop click, or nav selection, and returns focus to the toggle button. Tables wider than a phone viewport scroll horizontally inside their panel rather than crushing columns.

## Elevation & Depth

Depth comes from real material, not a flat fill: every panel is `backdrop-filter: blur()` over the ground at partial opacity, with a soft two-layer shadow (`shadow-material`/`shadow-materialLg`/`.sheet-material`'s own shadow) — a tight contact shadow plus a far, soft falloff — instead of a 1px border standing in for depth. Chrome (sidebar, mobile top bar) uses a more opaque variant of the same material so content stays legible scrolling underneath it.

### Named Rules
**The Material Rule.** A panel, sheet, or chrome surface is translucent + blurred + shadowed; it is never a flat opaque fill with only a hairline border for separation (the inverse of the prior world's Flat Ground Rule, deliberately — this is the one rule this redesign exists to overturn).

## Shapes

Large, consistent radii replace the prior world's flat 0px board segments: panels at `rounded-2xl` (1.25rem), floating sheets (dialogs, the nav drawer) at `rounded-3xl` (1.5rem, one edge square where the sheet meets the viewport edge), and controls (buttons, inputs, selects) at `rounded-xl` (0.75rem). Status/priority/role chips and camera tags stay fully rounded (`rounded-full`) pills.

## Components

### Buttons
- **Shape:** `rounded-xl`. **Primary:** `ops-accent` fill, `ops-bg` text, Geist semibold, normal case, `px-4 py-2`–`py-2.5`, the shared `.press` tactile feedback (scale to 0.97 on press, spring back on release).
- **Hover/Focus/Disabled:** background shifts to `ops-accentDim` on hover; `disabled:opacity-50`; focus-visible gets a 2px `ops-accent` outline, never a glow.
- **Destructive/Ghost:** plain text that turns `status-critical` on hover, no fill or border.

### Chips (status/priority pills, camera chips, role badge)
- **Style:** fully rounded, 1px border + 10% tint background in the relevant status color, status-colored text, `text-xs` Geist medium, `capitalize` (not uppercase). Color is entirely determined by the underlying value.

### Panels / Cards (`.panel-material`)
- Translucent (`rgba(20,22,27,0.62)`) + `backdrop-filter: blur(24px) saturate(150%)` + 1px near-white hairline (`rgba(255,255,255,0.07)`) + `rounded-2xl` + `shadow-material`. Internal padding `p-4`–`p-8` depending on size.

### Sheets (`.sheet-material`) — dialogs, the nav drawer
- More opaque (`rgba(20,22,27,0.82)`) and more blurred (`blur(32px)`) than a resting panel, `rounded-3xl`, a stronger two-layer shadow for real separation from the page, and the `animate-sheetIn` spring entrance. The nav drawer variant (`.drawer-sheet`) squares the edge flush against the viewport.

### Inputs / Fields
- `ops-panel2` background, 1px `ops-border`, `rounded-xl`, `px-3 py-2`–`py-2.5`. Focus shifts the border to `ops-accent`, no glow/shadow.

### Navigation
- Sidebar/drawer nav items are Geist medium, normal case, in a `rounded-2xl` pill shape at rest; the active item is a solid `ops-accent` fill with `ops-bg` text — never a colored border accent (unchanged from the prior world's rule, still true here).

### Spring Settle (signature motion)
`FlipValue` (frontend/src/components/FlipValue.tsx) wraps any live-updating value (risk score, status word, progress percent, count); it re-keys only on a real change and plays `animate-pop` (scale 0.96→1 + fade, 0.4s, `cubic-bezier(0.16,1,0.3,1)`). Material sheets (the incident dialog, the nav drawer) play `animate-sheetIn` on entry (translateY 8px→0 + scale 0.98→1 + fade). Both share the same smooth exponential curve as `.press` — a decelerate, not a bounce. `@media (prefers-reduced-motion: reduce)` swaps `animate-pop`/`animate-sheetIn` for a brief 0.15s fade and disables `.press`'s transform, but deliberately does **not** touch unrelated continuous feedback like the loading spinner (`animate-spin`), which would otherwise look frozen rather than respectfully still.

### Activity Log (shared component)
`ActivityLog` (frontend/src/components/ActivityLog.tsx) is the one shared implementation of the live narration feed used identically by CameraDetail and VideoDetail. Event types render as three-letter mono tags (`WPN`/`ANM`/`ESC`/`OK`), never a unicode/emoji icon glyph.

## Do's and Don'ts

### Do:
- **Do** build every panel/sheet/chrome surface as translucent + blurred + shadowed material (The Material Rule).
- **Do** reserve `status-critical/high/medium/low/ok` strictly for real severity, priority, or connection-state values (The Reserved State Rule).
- **Do** keep every text role in Geist, normal case, no heavy tracking (The No-Caps Rule) — hierarchy via size/weight/space.
- **Do** route every live-updating value through `FlipValue` and every sheet/drawer through `animate-sheetIn`, both on the shared smooth exponential easing.
- **Do** give a dialog/drawer Escape-to-close, initial focus on open, and focus returned to the trigger on close.

### Don't:
- **Don't** fall back to a flat opaque panel with just a hairline border — that is the prior world's rule, deliberately overturned here.
- **Don't** use an elastic/bounce easing curve (overshoot past 1.0); real decelerating motion doesn't wobble.
- **Don't** reach for a condensed display face, uppercase labels, or heavy letter-tracking anywhere in this world.
- **Don't** use Inter, or any purple/gradient accent, or invent a one-off hex color outside the documented tokens (The One Palette Rule).
- **Don't** apply a blanket `prefers-reduced-motion` kill to every animation/transition on the page — a continuous functional cue (a loading spinner) needs to keep running; only the decorative entrances lose their motion.
