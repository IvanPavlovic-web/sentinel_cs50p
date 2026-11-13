import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import type { PaginatedAuditLogs } from "../types";
import PageHeader from "../components/PageHeader";

export default function AuditLogs() {
  const [page, setPage] = useState(1);

  const { data } = useQuery({
    queryKey: ["audit-logs", page],
    queryFn: async () =>
      (await apiClient.get<PaginatedAuditLogs>("/api/audit-logs", { params: { page, page_size: 25 } })).data,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;

  return (
    <div className="space-y-8">
      <PageHeader title="Audit Logs" />

      <div className="vivid-card bg-loud-magenta/80 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Action</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Resource</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Details</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">IP</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Time</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((log) => (
              <tr key={log.id} className="border-t border-white/15 hover:bg-white/[0.06]">
                <td className="px-4 py-3 text-white font-semibold">{log.action}</td>
                <td className="px-4 py-3 text-white">
                  {log.resource_type ?? "-"} {log.resource_id ? `#${log.resource_id}` : ""}
                </td>
                <td className="px-4 py-3 text-white/60">{log.details ?? "-"}</td>
                <td className="px-4 py-3 text-white/60">{log.ip_address ?? "-"}</td>
                <td className="px-4 py-3 text-white/60">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-full bg-ops-borderStrong font-display text-xs font-semibold px-3 py-1.5 transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-ops-borderStrong"
        >
          Previous
        </button>
        <span className="tabular text-ops-muted">
          Page {page} of {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-full bg-ops-borderStrong font-display text-xs font-semibold px-3 py-1.5 transition-colors hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-ops-borderStrong"
        >
          Next
        </button>
      </div>
    </div>
  );
}
