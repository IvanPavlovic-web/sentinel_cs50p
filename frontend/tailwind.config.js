/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Apple's own system stack (San Francisco on Apple platforms,
        // falling through to each OS's native equivalent elsewhere): one
        // voice for every text role, hierarchy from size/weight/space
        // alone. Monospace stays reserved for genuinely tabular data.
        sans: ["-apple-system", "BlinkMacSystemFont", "\"SF Pro Text\"", "\"Segoe UI\"", "Roboto", "Helvetica", "Arial", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "\"SF Pro Display\"", "\"Segoe UI\"", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["\"Geist Mono\"", "ui-monospace", "monospace"],
      },
      colors: {
        // Night-ops dark ground (the honest choice for a console watched
        // in operations rooms, not a style pick), with panels built as
        // translucent material rather than flat fills. State color is
        // reserved for real severity/status, never decoration.
        ops: {
          bg: "#0a0b0d",
          panel: "#14161b",
          panel2: "#0e1013",
          border: "#262a31",
          borderStrong: "#3d434d",
          accent: "#f4f1ea",
          accentDim: "#c9c4b7",
          // Default Tailwind slate-500/600 fall below 4.5:1 on this
          // anthracite ground; this is the accessible secondary-text
          // neutral (~6:1 on ops-panel, ~7:1 on ops-bg).
          muted: "#9099a6",
        },
        status: {
          critical: "#ef4444",
          high: "#f97316",
          medium: "#f5c518",
          low: "#8b93a1",
          ok: "#22c55e",
        },
        // Full, saturated card fills for stat tiles (Reserved State Rule
        // still applies: critical/high/ok are deepened shades of the same
        // status hue above, never a different family). cyan/purple/
        // neutral are the decorative counterparts for tiles with no
        // status of their own. Each is tuned dark enough to carry white
        // text at >=4.5:1 as a flat, opaque fill -- not a translucent
        // glass tint like the rest of the panel system.
        card: {
          critical: "#991b1b",
          high: "#9a3412",
          ok: "#166534",
          cyan: "#155e75",
          purple: "#5b21b6",
          gold: "#92400e",
          neutral: "#202127",
        },
        // User-supplied loud palette (violet/lime/black), applied as
        // translucent glass card fills across the app shell and every
        // list/detail page (sidebar, auth, Cameras, Video Library,
        // Incidents, Analytics, Performance, Audit Logs). The five
        // original role names stay as aliases onto the three final hues
        // so every existing bg-loud-* class keeps working unchanged.
        // Purely decorative/brand -- severity still reads off the
        // reserved status ramp above, never off this set.
        loud: {
          lime: "#adff02",
          jade: "#adff02",
          violet: "#8f00ff",
          indigo: "#000000",
          magenta: "#000000",
        },
        // A vivid, varied palette for purely categorical color (object
        // classes, cameras) -- never used for severity/status, which
        // stays on the reserved ramp above. Mirrors the bento reference's
        // chart/category color system.
        vivid: {
          cyan: "#22D3EE",
          blue: "#3c2cff",
          pink: "#FF3DA5",
          amber: "#FFB800",
          green: "#7CFF5B",
          purple: "#8B3DFF",
          orange: "#FF5A1F",
          emerald: "#3BF08C",
        },
      },
      letterSpacing: {
        widest2: "0.14em",
      },
      boxShadow: {
        // Layered material depth: a tight contact shadow plus a soft, far
        // falloff, instead of a flat hairline border standing in for depth.
        material: "0 1px 1px rgba(0,0,0,0.3), 0 10px 30px -12px rgba(0,0,0,0.5)",
        materialLg: "0 2px 2px rgba(0,0,0,0.35), 0 24px 48px -16px rgba(0,0,0,0.55)",
        sheet: "0 8px 16px -4px rgba(0,0,0,0.4), 0 32px 64px -24px rgba(0,0,0,0.6)",
      },
      keyframes: {
        // The signature move: a settle used for both a material sheet
        // entering (panels, the nav drawer, the incident dialog) and a
        // live value changing (risk score, status, progress) -- calm and
        // physical, never a mechanical flip. Real decelerating objects
        // don't overshoot and wobble; the curve below is a smooth
        // exponential ease-out, not a bounce.
        pop: {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        sheetIn: {
          "0%": { transform: "translateY(8px) scale(0.98)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        pop: "pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        sheetIn: "sheetIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        fadeIn: "fadeIn 0.3s ease-out",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
