import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { apiClient } from "../api/client";
import type { IncidentAnalytics } from "../types";
import PageHeader from "../components/PageHeader";
import FlipValue from "../components/FlipValue";
import { objectClassColor, objectClassChip, cycleColor, cycleDot } from "../lib/objectClassColor";

const gridStroke = "#262a31";
const axisStroke = "#9099a6";
const tooltipStyle = { background: "#14161b", border: "1px solid #262a31", fontSize: 12 };
const tooltipLabelStyle = { color: "#f4f1ea" };

const DAY_RANGES = [7, 14, 30];

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/** The API only returns rows that actually have incidents, so hours/days
 * with zero are missing entirely; filled back in here so the chart reads
 * as a real 24h/N-day axis instead of a sparse, confusing one. */
function fillHours(data: IncidentAnalytics["by_hour"]): { hour: string; count: number }[] {
  const byHour = new Map(data.map((d) => [d.hour, d.count]));
  return Array.from({ length: 24 }, (_, h) => ({ hour: formatHour(h), count: byHour.get(h) ?? 0 }));
}

function fillDays(data: IncidentAnalytics["by_day"], days: number): { date: string; count: number }[] {
  const byDate = new Map(data.map((d) => [d.date, d.count]));
  const out: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key.slice(5), count: byDate.get(key) ?? 0 });
  }
  return out;
}

export default function Analytics() {
  const [days, setDays] = useState(14);

  const { data } = useQuery({
    queryKey: ["incident-analytics", days],
    queryFn: async () => (await apiClient.get<IncidentAnalytics>("/api/dashboard/analytics", { params: { days } })).data,
    refetchInterval: 30000,
  });

  const hourlyData = data ? fillHours(data.by_hour) : [];
  const dailyData = data ? fillDays(data.by_day, days) : [];
  const totalIncidents = data?.by_object_class.reduce((sum, c) => sum + c.count, 0) ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        actions={
          <div className="flex items-center gap-1.5 text-xs">
            {DAY_RANGES.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-full border font-mono ${
                  days === d
                    ? "border-ops-accent text-ops-accent bg-ops-accent/10"
                    : "border-ops-border text-slate-400 hover:text-slate-200"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        }
      />

      {totalIncidents === 0 && (
        <div className="vivid-card bg-loud-lime/55 p-5">
          <p className="text-sm text-black/70">
            No incidents recorded yet. Charts fill in once cameras or videos start producing incidents.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="vivid-card bg-loud-indigo/80 p-5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">
            Incidents by hour of day <span className="text-white/60 normal-case tracking-normal">(UTC, all-time)</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData}>
              <defs>
                <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#3c2cff" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
              <XAxis dataKey="hour" stroke="rgba(255,255,255,0.6)" fontSize={10} interval={2} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.08)" }} contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
              <Bar dataKey="count" fill="url(#hourlyFill)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="vivid-card bg-loud-violet/60 p-5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">
            Daily trend <span className="text-white/60 normal-case tracking-normal">(last {days} days)</span>
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="dailyStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF3DA5" />
                  <stop offset="100%" stopColor="#FFB800" />
                </linearGradient>
                <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFB800" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#FFB800" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" fontSize={10} tickLine={false} axisLine={{ stroke: "rgba(255,255,255,0.2)" }} />
              <YAxis stroke="rgba(255,255,255,0.6)" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
              <Area type="monotone" dataKey="count" stroke="url(#dailyStroke)" strokeWidth={2.5} fill="url(#dailyFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        <div className="vivid-card bg-loud-indigo/80 p-5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">By camera</h2>
          {(!data || data.by_camera.length === 0) && <p className="text-sm text-white/70">No data yet.</p>}
          <ul className="space-y-2">
            {data?.by_camera.map((c, i) => (
              <li key={c.camera_id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-b border-white/15 last:border-0">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`size-2 rounded-[2px] shrink-0 ${cycleDot(i)}`} />
                  <span className="text-white truncate">{c.camera_name}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0 tabular">
                  <span className="text-white/60 text-xs">avg risk {c.avg_risk_score.toFixed(1)}</span>
                  <span className={`font-semibold ${cycleColor(i)}`}>
                    <FlipValue value={c.count} />
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="vivid-card bg-loud-violet/60 p-5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">By object class</h2>
          {(!data || data.by_object_class.length === 0) && <p className="text-sm text-white/70">No data yet.</p>}
          <div className="flex flex-wrap gap-2">
            {data?.by_object_class.map((c) => (
              <span
                key={c.object_class}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${objectClassChip(c.object_class)}`}
              >
                <span className={`capitalize font-semibold ${objectClassColor(c.object_class)}`}>{c.object_class}</span>
                <span className={`tabular font-semibold ${objectClassColor(c.object_class)}`}>
                  <FlipValue value={c.count} />
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
