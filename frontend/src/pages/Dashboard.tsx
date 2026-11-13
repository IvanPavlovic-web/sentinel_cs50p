import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { apiClient } from "../api/client";
import type { Camera, DashboardSummary, Incident, PaginatedIncidents } from "../types";
import StatTile from "../components/StatTile";
import PageHeader from "../components/PageHeader";
import FlipValue from "../components/FlipValue";

const priorityPill: Record<string, string> = {
  critical: "text-status-critical border-status-critical/40 bg-status-critical/10",
  high: "text-status-high border-status-high/40 bg-status-high/10",
  medium: "text-status-medium border-status-medium/40 bg-status-medium/10",
  low: "text-status-low border-status-low/40 bg-status-low/10",
};

const priorityBarColor: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f5c518",
  low: "#8b93a1",
};

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await apiClient.get<DashboardSummary>("/api/dashboard/summary")).data,
    refetchInterval: 10000,
  });

  const { data: incidents } = useQuery({
    queryKey: ["recent-incidents"],
    queryFn: async () =>
      (await apiClient.get<PaginatedIncidents>("/api/incidents", { params: { page: 1, page_size: 5 } })).data,
    refetchInterval: 10000,
  });

  // latest_job_status comes back inline with the list (see Cameras.tsx for
  // the same fix), so this needs one request instead of one per camera.
  const { data: cameras } = useQuery({
    queryKey: ["cameras"],
    queryFn: async () => (await apiClient.get<Camera[]>("/api/cameras")).data,
    refetchInterval: 10000,
  });

  const priorityData = summary
    ? Object.entries(summary.incidents_by_priority).map(([priority, count]) => ({ priority, count }))
    : [];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatTile label="Cameras" value={summary?.total_cameras ?? "-"} accent="cyan" />
        <StatTile
          label="Live Now"
          value={summary?.active_cameras ?? "-"}
          accent={summary && summary.active_cameras > 0 ? "green" : "default"}
        />
        <StatTile label="Open Incidents" value={summary?.open_incidents ?? "-"} accent="red" />
        <StatTile label="Incidents (24h)" value={summary?.incidents_last_24h ?? "-"} accent="amber" />
      </div>

      <div className="vivid-card bg-loud-indigo/80 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white">Cameras</h2>
          <Link to="/cameras" className="text-xs text-white/80 hover:underline">
            Manage cameras
          </Link>
        </div>
        {(!cameras || cameras.length === 0) && (
          <p className="text-sm text-white/70">
            No cameras connected yet. Add one under Cameras to start live monitoring.
          </p>
        )}
        {cameras && cameras.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cameras.map((camera) => {
              const isLive = camera.latest_job_status === "pending" || camera.latest_job_status === "processing";
              return (
                <Link
                  key={camera.id}
                  to={`/cameras/${camera.id}`}
                  className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full border border-white/15 bg-white/10 hover:border-white/40"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-status-ok animate-pulse" : "bg-white/30"}`} />
                  <span className="text-white">{camera.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatTile label="Total Videos" value={summary?.total_videos ?? "-"} accent="purple" />
        <StatTile label="Jobs Processing" value={summary?.jobs_processing ?? "-"} accent="amber" />
        <StatTile label="Jobs Completed" value={summary?.jobs_completed ?? "-"} accent="green" />
        <StatTile label="Jobs Failed" value={summary?.jobs_failed ?? "-"} accent="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="vivid-card bg-loud-violet/60 p-5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">Incidents by Priority</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#35363d" vertical={false} />
              <XAxis dataKey="priority" stroke="#a6a7ad" fontSize={11} tickLine={false} axisLine={{ stroke: "#35363d" }} />
              <YAxis stroke="#a6a7ad" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.06)" }}
                contentStyle={{ background: "#14161b", border: "1px solid #35363d", fontSize: 12 }}
                labelStyle={{ color: "#f4f1ea" }}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} maxBarSize={48}>
                {priorityData.map((entry) => (
                  <Cell key={entry.priority} fill={priorityBarColor[entry.priority] ?? "#8b93a1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="vivid-card bg-loud-magenta/80 p-5">
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">Live Board — Recent Incidents</h2>
          {incidents?.items.length === 0 && (
            <p className="text-sm text-white/65">No incidents yet. The dashboard fills in once a camera or video is analyzed.</p>
          )}
          {incidents?.items.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/65 tracking-[-0.01em]">
                  <th className="pb-2 font-medium">Object</th>
                  <th className="pb-2 font-medium">Priority</th>
                  <th className="pb-2 font-medium text-right">Risk</th>
                </tr>
              </thead>
              <tbody>
                {incidents.items.map((incident: Incident) => (
                  <tr key={incident.id} className="border-t border-white/15">
                    <td className="py-2.5 pr-3 text-white truncate max-w-[14rem]">{incident.summary}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex text-xs font-medium capitalize px-2 py-0.5 rounded-full border ${
                          priorityPill[incident.priority] ?? priorityPill.low
                        }`}
                      >
                        <FlipValue value={incident.priority} />
                      </span>
                    </td>
                    <td className="py-2.5 tabular text-right font-medium text-white">
                      <FlipValue value={incident.risk_score.toFixed(1)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}
