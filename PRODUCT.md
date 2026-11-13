# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are home users and small physical-security teams (warehouses,
retail back-of-house, construction sites) who own cameras but can't justify
an expensive cloud VMS/AI subscription or a human watching a wall of feeds.
Three roles use the app directly: `admin` (full control, users, audit log),
`analyst` (uploads video, configures cameras/zones/rules, resolves
incidents), and `viewer` (read-only: video, progress, incidents, reports).
There is no public marketing surface; every page is behind authentication.

## Product Purpose

SentinelAI is a self-hostable video-intelligence platform with two ways in:
a live camera (RTSP) for continuous monitoring, or an uploaded video file
for one-shot analysis. It detects and tracks every person/vehicle, narrates
what it sees in plain language as it happens, shows an annotated preview
(detection boxes, track IDs, color, confidence, Risk), and raises
explainable, scored incidents when behavior crosses a configured threshold.
Success means an operator can answer "who/what is here, did something
cross a line, which cameras generate the most incidents" without staring
at raw video or paying for a cloud subscription.

## Positioning

A self-hosted, CPU-only (no GPU requirement) video-intelligence pipeline
with an original, fully explainable 0-100 Risk score (zone severity, dwell
time, motion anomaly, time-of-day, confidence persistence, with smoothing
and hysteresis against noisy duplicate alerts) and a human-readable live
narration of what each tracked object is doing, not just a wall of
bounding boxes. A neighboring product could not truthfully copy this
without also exposing the same explainability.

## Operating Context

Operators work from a role-based dashboard: Login/Register, Dashboard
(camera status, stat tiles, incidents-by-priority chart, recent incidents),
Cameras (add/remove, test RTSP connection, start/stop monitoring - never
started automatically), Camera Detail (live auto-refreshing snapshot,
click-to-draw zone editor with severity/dwell/rule-class/threshold
controls, live activity log, linked incidents), Video Library
(upload/processing status/delete), Video Detail (annotated AI preview,
detections panel, linked incidents), Incidents (filterable table with a
resolve/dismiss workflow and alert-delivery column), Analytics (incidents
by hour/day/camera/class), Performance (latency/FPS/queue/CPU/RAM charts),
and an admin-only Audit Logs page. Real-time data arrives over WebSockets
(job progress, live incident feed, live activity narration) while the
underlying analysis runs as a background job (Celery), so screens must
read correctly both mid-processing and once complete.

## Capabilities and Constraints

- Detection/tracking always runs on upload; zone-based Risk scoring (the
  Z term) only applies to a camera's live-monitoring sessions, where zones
  are configured, not to dashboard-uploaded videos.
- A camera's "live view" is a frequently refreshed snapshot JPEG, not a
  true low-latency video stream.
- Weapon detection runs a second dedicated model alongside the main
  detector and is always `critical` severity; a detected weapon near an
  active person track raises a CRITICAL incident immediately.
- Existing stack: React 18, Vite, TypeScript, Tailwind CSS, React Router,
  TanStack Query, Recharts. Main bundle is route-level code-split
  (`React.lazy`); `recharts` is isolated to the 3 pages that use it.
- JWT auth (short-lived access + rotating refresh tokens) with per-route
  RBAC; every protected route depends on a role check.

## Brand Commitments

Product name "SentinelAI" is fixed. No other visual identity is binding.
Two prior visual worlds exist as evidence/anti-reference, not constraints:
(1) the original black/white/gray "security operations console" theme
(Inter + Space Grotesk + JetBrains Mono, no accent hue), and (2) a
split-flap "Live Board" world built, polished, and audited earlier in
this project's history (condensed display caps, flat 0px-radius panels,
no shadow/blur/gradient). Both were explicitly superseded by later
redesign briefs. The current standing brief (Apple-inspired: calm
hierarchy, generous space, translucent materials, spring motion with a
reduced-motion fallback; no Apple logo/branding/screens copied) is what
new work should build toward. "Inter" specifically remains off-limits:
the user has twice explicitly excluded it across separate redesign
briefs in this project.

One standing, explicit exception to the "no generic gradient" brief and
to DESIGN.md's One Palette Rule: a multi-hue animated radial gradient
background (`AnimatedGradientBackground`, blue/pink/orange/yellow/green/
indigo) is deliberately used behind the full app shell and both auth
screens, confirmed by the user after being flagged against exactly these
rules. Do not remove or desaturate it as an unprompted "fix."

## Evidence on Hand

Real content exists to design against: actual API/data shapes (cameras,
zones, rules, tracked objects, incidents, performance metrics), real
demo accounts and seeded demo cameras (public Bosnia & Herzegovina
webcams), and a working backend. No testimonials, press, pricing, or
case studies exist and none should be fabricated - this is a CS50P
project / self-hosted platform, not a company with customers to quote.

## Product Principles

- Explainability over opacity: every score and alert must read as
  something the system can justify, never a black-box number.
- No fabricated data: a result is always something the model actually
  saw; the design must never imply certainty the pipeline doesn't have.
- Operator clarity under load: this is a security console watched during
  real incidents, so scanability and fast comprehension outrank decoration.
- Self-hosted, CPU-only, no-GPU ethos carries into the design: lean,
  utilitarian competence rather than glossy cloud-SaaS polish.
- Three roles, one system: the same screens serve admin/analyst/viewer;
  hierarchy and permissions must stay legible without separate skins.

## Accessibility & Inclusion

WCAG AA is the standard: contrast, visible focus states, and keyboard
operability apply across the redesign.
