import {
  SiReact,
  SiTypescript,
  SiTailwindcss,
  SiVite,
  SiPython,
  SiFastapi,
  SiPostgresql,
  SiRedis,
  SiDocker,
  SiOpencv,
} from "react-icons/si";
import LogoLoop from "./LogoLoop";
import GlitchWordmark from "./GlitchWordmark";

// The project's own real stack (frontend/package.json, backend
// requirements.txt, docker-compose.yml) -- real brand icons here, not
// text pills, since these are the actual tools the app is built on.
const techLogos = [
  { node: <SiReact />, title: "React", hoverColor: "#61dafb" },
  { node: <SiTypescript />, title: "TypeScript", hoverColor: "#3178c6" },
  { node: <SiTailwindcss />, title: "Tailwind CSS", hoverColor: "#38bdf8" },
  { node: <SiVite />, title: "Vite", hoverColor: "#bd34fe" },
  { node: <SiPython />, title: "Python", hoverColor: "#3776ab" },
  { node: <SiFastapi />, title: "FastAPI", hoverColor: "#009688" },
  { node: <SiPostgresql />, title: "PostgreSQL", hoverColor: "#4169e1" },
  { node: <SiRedis />, title: "Redis", hoverColor: "#dc382d" },
  { node: <SiOpencv />, title: "OpenCV", hoverColor: "#5c3ee8" },
  { node: <SiDocker />, title: "Docker", hoverColor: "#2496ed" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer-material mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <GlitchWordmark iconClassName="w-5 h-5" textClassName="text-sm" subtitle="Edge Video Intelligence" gap="gap-2" />
          <p className="text-xs text-white/60 max-w-md">
            Self-hosted, CPU-only video intelligence: explainable 0-100 Risk scoring and live narration, no cloud
            subscription required. Works with Reolink, Hikvision, TP-Link Tapo, Wyze, and other RTSP/ONVIF cameras.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/40 mb-3">Built with</p>
          <div className="h-8 text-white/70">
            <LogoLoop
              logos={techLogos}
              speed={40}
              direction="left"
              logoHeight={26}
              gap={48}
              fadeOut
              fadeOutWidth={0.15}
              pauseOnHover
              scaleOnHover
              ariaLabel="Technology stack"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/40 pt-4 border-t border-white/10">
          <span>© {year} SentinelAI</span>
          <span className="tabular">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
