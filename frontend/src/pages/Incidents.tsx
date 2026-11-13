import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { Incident, IncidentStatus, PaginatedIncidents } from "../types";
import PageHeader from "../components/PageHeader";
import FlipValue from "../components/FlipValue";

const priorityColor: Record<string, string> = {
  low: "text-status-low",
  medium: "text-status-medium",
  high: "text-status-high",
  critical: "text-status-critical font-bold",
};

export default function Incidents() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [notes, setNotes] = useState("");
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const reviewButtonRefs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    if (selected) {
      notesRef.current?.focus();
    }
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const id = selected.id;
        setSelected(null);
        setNotes("");
        reviewButtonRefs.current.get(id)?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  const { data } = useQuery({
    queryKey: ["incidents", statusFilter, priorityFilter],
    queryFn: async () =>
      (
        await apiClient.get<PaginatedIncidents>("/api/incidents", {
          params: { status: statusFilter || undefined, priority: priorityFilter || undefined, page_size: 50 },
        })
      ).data,
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: IncidentStatus }) =>
      apiClient.patch(`/api/incidents/${id}/status`, { status, resolution_notes: notes || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      const id = selected?.id;
      setSelected(null);
      setNotes("");
      if (id !== undefined) reviewButtonRefs.current.get(id)?.focus();
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Incidents" />

      <div className="flex gap-3">
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full bg-ops-panel2 border border-ops-border px-3 py-2 text-sm transition-colors focus:outline-none focus:border-ops-accent"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          aria-label="Filter by priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-full bg-ops-panel2 border border-ops-border px-3 py-2 text-sm transition-colors focus:outline-none focus:border-ops-accent"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="vivid-card bg-loud-violet/60 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Object</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Risk</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Priority</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Status</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Alert</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Detected</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((incident) => (
              <tr key={incident.id} className="border-t border-white/15 hover:bg-white/[0.06]">
                <td className="px-4 py-3 text-white">{incident.object_class}</td>
                <td className="px-4 py-3 tabular font-semibold text-white">
                  <FlipValue value={incident.risk_score.toFixed(1)} />
                </td>
                <td className={`px-4 py-3 uppercase ${priorityColor[incident.priority]}`}>
                  <FlipValue value={incident.priority} />
                </td>
                <td className="px-4 py-3 text-white">
                  <FlipValue value={incident.status} />
                </td>
                <td className="px-4 py-3">
                  {incident.alert_sent ? (
                    <span
                      className="text-status-ok text-xs font-medium"
                      title={incident.alert_channels ? `Sent via ${incident.alert_channels}` : "Alert attempted; no channel confirmed delivery"}
                    >
                      sent{incident.alert_channels ? ` (${incident.alert_channels})` : ""}
                    </span>
                  ) : (
                    <span className="text-white/60 text-xs font-medium">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/70">{new Date(incident.detected_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    ref={(el) => {
                      if (el) reviewButtonRefs.current.set(incident.id, el);
                      else reviewButtonRefs.current.delete(incident.id);
                    }}
                    onClick={() => setSelected(incident)}
                    className="text-white font-medium hover:underline"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-white/70" colSpan={7}>
                  No incidents found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] px-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="incident-dialog-title"
        >
          <div className="vivid-card bg-loud-magenta/80 p-6 w-full max-w-md animate-sheetIn">
            <h2 id="incident-dialog-title" className="font-display text-xl font-semibold tracking-tight mb-2 text-white">
              Incident #{selected.id}
            </h2>
            <p className="text-sm text-white/70 mb-4">{selected.summary}</p>
            <textarea
              ref={notesRef}
              aria-label="Resolution notes"
              placeholder="Resolution notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-2xl bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 mb-4 transition-colors focus:outline-none focus:border-white/50"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  const id = selected.id;
                  setSelected(null);
                  setNotes("");
                  reviewButtonRefs.current.get(id)?.focus();
                }}
                className="text-sm text-white/60 hover:text-white press"
              >
                Cancel
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: selected.id, status: "dismissed" })}
                className="rounded-full bg-white/15 text-white font-display text-sm font-semibold px-4 py-2 hover:bg-white/25 press"
              >
                Dismiss
              </button>
              <button
                onClick={() => updateStatus.mutate({ id: selected.id, status: "resolved" })}
                className="rounded-full bg-white text-black font-display font-semibold text-sm px-4 py-2 hover:bg-white/80 press"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
