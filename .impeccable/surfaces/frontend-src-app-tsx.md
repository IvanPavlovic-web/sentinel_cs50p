---
version: 1
slug: "frontend-src-app-tsx"
primary_target: "frontend/src/App.tsx"
related_targets: []
---

## Direction contract

THESIS: SentinelAI drops the mechanical "live board" metaphor for a calm, confident operating surface: the console reads as something considered and quiet, not something clicking. The category default this refuses: dense, mechanical dashboard chrome (flap/board gimmicks, hard flat panels, loud condensed caps everywhere) as the only alternative to a generic glass-card SaaS look.

OWN-WORLD: Apple-system materiality, translated for a self-hosted security console, not Apple's brand. Ground stays dark (the product is watched in operations rooms and at night; dark is the honest choice for this use scene, not a style pick) but the near-black anthracite deepens slightly and panels become true layered material: translucent surfaces (`backdrop-filter: blur`) over the ground, soft multi-stop shadows (never a flat 1px border alone), and large, consistent corner radii (16-20px) instead of the old flat 0px board segments. One calm, neutral grotesk (Instrument Sans) carries every text role at every weight - no condensed display caps, no tracked uppercase row labels - letting hierarchy come from size, weight and space, not shouting. JetBrains Mono stays for genuinely tabular data only. State color (the existing reserved severity ramp - critical/high/medium/low/ok) is unchanged: this redesign changes material and motion, not the product's meaning-bearing colors. Spacing opens up throughout: panels, forms and tables get real breathing room instead of the previous dense board rhythm.

STORY: An operator opens any screen and it feels unhurried and considered - information is still fully scannable, but nothing demands attention through noise. Panels and the mobile nav drawer feel like physical sheets of frosted material settling into place with a natural spring, not snapping or sliding flatly. A live-updating number (risk score, progress, status) still visibly changes, but gently - a soft scale-and-fade settle, not a mechanical flip. Every spring motion has a true `prefers-reduced-motion` fallback that still shows the state change (a quick crossfade), never a motion-only cue with no fallback.

FIRST VIEWPORT (Dashboard, the representative screen): the same information architecture as today (stat row, camera status panel, incidents-by-priority chart, recent-incidents table) rebuilt in the new material: generously spaced stat tiles as soft frosted cards with large radii and a gentle colored glow (not a hard top bar) for status, panels as translucent sheets with real shadow depth, and the recent-incidents table's live cells settling with the new spring-pop instead of flipping. The sidebar itself becomes a vibrant frosted material panel, like a macOS sidebar, rather than a flat bordered rail.

FORM: Brief-pinned directly by the user ("Apple-inspired design... translucent materials... spring animations... avoid Apple branding/screens") - no direction roll; a pinned brief beats the roll per policy. Translated into this product's own facts and Operate-mode's directions limit (the world lends type, palette, density and one signature move; navigation, controls and layout stay the standard web components already in place). Replaces the prior "Live Board" split-flap world (seed:16c75e6b28dc24bb) from earlier this session, which becomes evidence/anti-reference, not a constraint. seed: none (brief-pinned)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
