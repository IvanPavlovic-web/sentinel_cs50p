import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { apiClient } from "../api/client";
import type { PerformancePoint } from "../types";
import PageHeader from "../components/PageHeader";

const gridStroke = "#262a31";
const axisStroke = "#9099a6";
const tooltipStyle = { background: "#14161b", border: "1px solid #262a31", fontSize: 12 };
const tooltipLabelStyle = { color: "#f4f1ea" };

export default function Performance() {
  const { data } = useQuery({
    queryKey: ["dashboard-performance"],
    queryFn: async () =>
      (await apiClient.get<{ points: PerformancePoint[] }>("/api/dashboard/performance")).data.points,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Performance" />

      <div className="vivid-card bg-loud-indigo/80 p-5">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">Processing FPS &amp; Latency</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="job_id" stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
            <Line type="monotone" dataKey="processing_fps" stroke="#22D3EE" name="FPS" strokeWidth={2.5} dot={false} />
            <Line
              type="monotone"
              dataKey="avg_latency_ms"
              stroke="#FFB800"
              name="Avg Latency (ms)"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p95_latency_ms"
              stroke="#FF3DA5"
              name="P95 Latency (ms)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="vivid-card bg-loud-violet/60 p-5">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">Resource Usage</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
            <XAxis dataKey="job_id" stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.6)" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }} />
            <Line type="monotone" dataKey="avg_cpu_percent" stroke="#22D3EE" name="Avg CPU %" strokeWidth={2.5} dot={false} />
            <Line
              type="monotone"
              dataKey="avg_ram_mb"
              stroke="#FFB800"
              name="Avg RAM (MB)"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
