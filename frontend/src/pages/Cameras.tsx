import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import type { Camera, CameraConnectionTestResult } from "../types";
import PageHeader from "../components/PageHeader";
import FlipValue from "../components/FlipValue";

export default function Cameras() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [rtspUrl, setRtspUrl] = useState("");
  const [testResult, setTestResult] = useState<CameraConnectionTestResult | null>(null);

  // Each camera's latest_job_status comes back inline with the list itself
  // (GET /api/cameras/{id}/jobs isn't called per row here), so the status
  // chip below needs exactly one request regardless of camera count.
  const { data: cameras, isLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: async () => (await apiClient.get<Camera[]>("/api/cameras")).data,
    refetchInterval: 8000,
  });

  const testMutation = useMutation({
    mutationFn: async () => (await apiClient.post<CameraConnectionTestResult>("/api/cameras/test-connection", { rtsp_url: rtspUrl })).data,
    onSuccess: (result) => setTestResult(result),
    onError: () => setTestResult({ ok: false, detail: "Connection test failed." }),
  });

  const createMutation = useMutation({
    mutationFn: async () => apiClient.post("/api/cameras", { name, location: location || null, rtsp_url: rtspUrl || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cameras"] });
      setName("");
      setLocation("");
      setRtspUrl("");
      setTestResult(null);
    },
  });

  const startMutation = useMutation({
    mutationFn: async (cameraId: number) => apiClient.post(`/api/cameras/${cameraId}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cameras"] }),
  });

  const stopMutation = useMutation({
    mutationFn: async (cameraId: number) => apiClient.post(`/api/cameras/${cameraId}/stop`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cameras"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (cameraId: number) => apiClient.delete(`/api/cameras/${cameraId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cameras"] }),
  });

  const statusFor = (camera: Camera): { label: string; dotClass: string } => {
    if (camera.latest_job_status === "pending" || camera.latest_job_status === "processing") {
      return { label: "Live", dotClass: "bg-status-ok animate-pulse" };
    }
    if (camera.latest_job_status === "failed") {
      return { label: "Error", dotClass: "bg-status-critical" };
    }
    return { label: "Idle", dotClass: "bg-ops-borderStrong" };
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Cameras" />

      <div className="vivid-card bg-loud-indigo/80 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Status</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Name</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Location</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/60 tracking-[-0.01em]">Stream</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3 text-white/60" colSpan={5}>
                  Loading cameras...
                </td>
              </tr>
            )}
            {cameras?.map((camera) => {
              const { label, dotClass } = statusFor(camera);
              const isLive = camera.latest_job_status === "pending" || camera.latest_job_status === "processing";
              return (
                <tr key={camera.id} className="border-t border-white/15 hover:bg-white/[0.06]">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-xs font-medium capitalize text-white">
                      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                      <FlipValue value={label} />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/cameras/${camera.id}`} className="text-white font-semibold hover:underline">
                      {camera.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white/60">{camera.location ?? "-"}</td>
                  <td className="px-4 py-3 text-white/60 font-mono text-xs truncate max-w-[220px]">
                    {camera.rtsp_url ?? "not configured"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {isLive ? (
                      <button
                        onClick={() => stopMutation.mutate(camera.id)}
                        disabled={stopMutation.isPending}
                        className="text-red-400 font-medium hover:underline disabled:opacity-50"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => startMutation.mutate(camera.id)}
                        disabled={startMutation.isPending || !camera.rtsp_url}
                        className="text-white font-medium hover:underline disabled:opacity-40"
                        title={!camera.rtsp_url ? "Add a stream URL first" : undefined}
                      >
                        Start
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove camera "${camera.name}"? This cannot be undone.`)) deleteMutation.mutate(camera.id);
                      }}
                      className="ml-3 text-white/60 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
            {cameras?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-white/60" colSpan={5}>
                  No cameras added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="vivid-card bg-loud-magenta/80 p-5 max-w-xl">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-4">Connect a camera</h2>
        <p className="text-xs text-white/65 mb-4">
          Enter your camera's RTSP stream URL. Most home IP cameras (Reolink, TP-Link Tapo, Hikvision, Wyze with RTSP
          firmware, and similar) expose one, typically in the form
          <code className="mx-1 text-white/80">rtsp://user:password@camera-ip:554/stream1</code>
          and listed in the camera's own app under network or advanced settings.
        </p>
        <div className="space-y-3">
          <input
            aria-label="Camera name"
            placeholder="Camera name (e.g. Front Door)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-full bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 transition-colors focus:outline-none focus:border-white/50"
          />
          <input
            aria-label="Location"
            placeholder="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-full bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 transition-colors focus:outline-none focus:border-white/50"
          />
          <input
            aria-label="RTSP stream URL"
            placeholder="rtsp://..."
            value={rtspUrl}
            onChange={(e) => {
              setRtspUrl(e.target.value);
              setTestResult(null);
            }}
            className="w-full rounded-full bg-white/10 border border-white/20 px-3 py-2 text-sm font-mono text-white placeholder:text-white/40 transition-colors focus:outline-none focus:border-white/50"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => testMutation.mutate()}
              disabled={!rtspUrl || testMutation.isPending}
              className="rounded-full border border-white/25 text-sm px-3 py-2 text-white hover:bg-white/10 disabled:opacity-40"
            >
              {testMutation.isPending ? "Testing..." : "Test connection"}
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!name || createMutation.isPending}
              className="rounded-full bg-white text-black font-display font-semibold text-sm px-4 py-2 hover:bg-white/80 disabled:opacity-50 press"
            >
              Add camera
            </button>
          </div>
          {testResult && (
            <p className={`text-xs font-medium ${testResult.ok ? "text-green-400" : "text-red-400"}`}>
              {testResult.ok
                ? `Connected (${testResult.width ?? "?"}x${testResult.height ?? "?"} @ ${testResult.fps?.toFixed(0) ?? "?"} fps).`
                : testResult.detail ?? "Could not connect."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
