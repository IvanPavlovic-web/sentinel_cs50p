import { useEffect, useRef } from "react";
import type { DetectionBox } from "../types";

// Mirrors tailwind.config.js `vivid` palette, as raw hex -- canvas drawing
// can't consume Tailwind utility classes, so this is the one place that
// palette is duplicated as actual color values.
const CLASS_STROKE: Record<string, string> = {
  person: "#22D3EE",
  car: "#3c2cff",
  truck: "#8B3DFF",
  motorcycle: "#FF3DA5",
  bus: "#FFB800",
  knife: "#FF5A1F",
  gun: "#FF5A1F",
  pistol: "#FF5A1F",
  rifle: "#FF5A1F",
  weapon: "#FF5A1F",
  firearm: "#FF5A1F",
  grenade: "#FF5A1F",
  missile: "#FF5A1F",
};
const FALLBACK_STROKE = "#7CFF5B";

// How long (seconds) a box keeps being drawn after its last sampled
// detection before it's considered stale and dropped. Detections only
// arrive every FRAME_SAMPLE_RATE-th frame, not every frame, so without
// some hold a box would flicker on/off between samples instead of
// appearing to continuously track the person.
const HOLD_SECONDS = 1.5;

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  boxes: DetectionBox[];
  sourceWidth: number;
  sourceHeight: number;
  active: boolean;
}

export default function DetectionOverlay({ videoRef, boxes, sourceWidth, sourceHeight, active }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxesRef = useRef(boxes);
  boxesRef.current = boxes;

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !active || !sourceWidth || !sourceHeight) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const rect = video.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width));
      canvas.height = Math.max(1, Math.round(rect.height));
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(video);
    resize();

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!canvas.width || !canvas.height) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = video.currentTime;
      const scaleX = canvas.width / sourceWidth;
      const scaleY = canvas.height / sourceHeight;

      // Latest-still-fresh box per track, so one track draws exactly one
      // box per frame even though many sampled observations exist for it.
      // Boxes are sorted by time: binary-search the start of the
      // [now - HOLD, now] window instead of scanning every box each frame.
      const all = boxesRef.current;
      let lo = 0;
      let hi = all.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (all[mid].timestamp_seconds < now - HOLD_SECONDS) lo = mid + 1;
        else hi = mid;
      }
      const latestByTrack = new Map<number, DetectionBox>();
      for (let i = lo; i < all.length && all[i].timestamp_seconds <= now; i++) {
        const box = all[i];
        const current = latestByTrack.get(box.track_number);
        if (!current || box.timestamp_seconds > current.timestamp_seconds) {
          latestByTrack.set(box.track_number, box);
        }
      }

      for (const box of latestByTrack.values()) {
        const stroke = CLASS_STROKE[box.object_class.toLowerCase()] ?? FALLBACK_STROKE;
        const x = box.bbox_x1 * scaleX;
        const y = box.bbox_y1 * scaleY;
        const w = (box.bbox_x2 - box.bbox_x1) * scaleX;
        const h = (box.bbox_y2 - box.bbox_y1) * scaleY;

        ctx.lineWidth = 2;
        ctx.strokeStyle = stroke;
        ctx.strokeRect(x, y, w, h);

        // A person's color is their clothing, never an adjective on them.
        const known = box.dominant_color !== "unknown";
        const name =
          box.object_class === "person"
            ? `person${known ? ` in ${box.dominant_color}` : ""}`
            : `${known ? `${box.dominant_color} ` : ""}${box.object_class}`;
        const label = `${name} #${box.track_number} ${(box.confidence * 100).toFixed(0)}%`;
        ctx.font = "600 12px -apple-system, sans-serif";
        const textWidth = ctx.measureText(label).width;
        const labelY = Math.max(y - 16, 0);
        ctx.fillStyle = stroke;
        ctx.fillRect(x, labelY, textWidth + 8, 16);
        ctx.fillStyle = "#0a0b0d";
        ctx.fillText(label, x + 4, labelY + 12);
      }
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [videoRef, active, sourceWidth, sourceHeight]);

  if (!active) return null;

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none rounded-xl" />;
}
