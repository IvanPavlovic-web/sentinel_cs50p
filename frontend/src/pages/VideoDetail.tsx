import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, authenticatedStreamUrl } from "../api/client";
import type {
  ActivityEvent,
  DetectionBox,
  EventSeverity,
  Incident,
  JobDetectionsSummary,
  JobProgressMessage,
  ProcessingJob,
  VideoSource,
} from "../types";
import { useWebSocket } from "../hooks/useWebSocket";
import PageHeader from "../components/PageHeader";
import FlipValue from "../components/FlipValue";
import ActivityLog, { severityStyle } from "../components/ActivityLog";
import DetectionOverlay from "../components/DetectionOverlay";
import { objectClassColor, objectClassChip } from "../lib/objectClassColor";

const statusLabel: Record<string, string> = {
  pending: "Queued",
  processing: "Analyzing…",
  completed: "Completed",
  failed: "Failed",
};

export default function VideoDetail() {
  const { id } = useParams();
  const videoId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Every job ever run for this video, newest first: lets the page find
  // and subscribe to live progress right after upload, without requiring
  // the user to click "Reprocess" first.
  const { data: jobs } = useQuery({
    queryKey: ["video-jobs", videoId],
    queryFn: async () => (await apiClient.get<ProcessingJob[]>(`/api/videos/${videoId}/jobs`)).data,
    enabled: !!videoId,
    refetchInterval: (query) => {
      const latest = query.state.data?.[0];
      return latest && (latest.status === "pending" || latest.status === "processing") ? 4000 : false;
    },
  });

  // video.width/height start out null and are only filled in by the
  // backend right after a processing job starts (see process_video_task).
  // Without polling here too, this stays stale for the entire run of a
  // live job, so the detection-overlay canvas never learns the source
  // resolution it needs to scale boxes into and never draws anything.
  const { data: video } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => (await apiClient.get<VideoSource>(`/api/videos/${videoId}`)).data,
    enabled: !!videoId,
    refetchInterval: (query) => {
      const latest = jobs?.[0];
      const stillNeedsSize = !query.state.data?.width || !query.state.data?.height;
      return latest && (latest.status === "pending" || latest.status === "processing") && stillNeedsSize ? 1500 : false;
    },
  });

  // A "playback session": from the moment Reprocess is clicked (or the
  // page opens on a job that's already running) until the video ends.
  // While it's on, the video plays from the start, the activity log only
  // shows events up to the current playhead -- so each line appears the
  // moment the footage it describes is on screen -- and playback holds
  // whenever it catches up to footage the AI hasn't analyzed yet.
  const [session, setSession] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [heldForAnalysis, setHeldForAnalysis] = useState(false);
  // Set right before we pause the video ourselves, so the resulting
  // "pause" event isn't mistaken for the user pausing it manually.
  const autoPausingRef = useRef(false);

  const startPlaybackSession = () => {
    setSession(true);
    setHeldForAnalysis(false);
    setPlayhead(0);
    const el = videoRef.current;
    if (el) {
      el.currentTime = 0;
      el.play().catch(() => {
        // Autoplay with sound refused (no user gesture): retry muted.
        el.muted = true;
        el.play().catch(() => undefined);
      });
    }
  };

  const reprocessMutation = useMutation({
    mutationFn: async () => (await apiClient.post<ProcessingJob>(`/api/videos/${videoId}/process`)).data,
    onMutate: () => {
      // Start inside the click's user gesture, so the browser allows sound.
      startPlaybackSession();
    },
    onSuccess: (newJob) => {
      // Put the new job at the head of the list immediately instead of
      // waiting for a refetch, so the page subscribes to its live feed
      // right away and never narrates the previous run's events.
      queryClient.setQueryData<ProcessingJob[]>(["video-jobs", videoId], (old) => [
        newJob,
        ...(old ?? []).filter((j) => j.id !== newJob.id),
      ]);
      queryClient.invalidateQueries({ queryKey: ["video-jobs", videoId] });
    },
    onError: () => setSession(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => apiClient.delete(`/api/videos/${videoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      navigate("/videos");
    },
  });

  const activeJob = jobs?.[0];
  const isLive = activeJob?.status === "pending" || activeJob?.status === "processing";

  // While a job is live, accumulate every event seen over the WebSocket
  // (deduped by id). The server sends each event exactly once, so this is
  // done per message, not per render, to never drop one.
  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([]);
  const activeJobIdRef = useRef<number | undefined>(undefined);
  activeJobIdRef.current = activeJob?.id;
  useEffect(() => {
    setLiveEvents([]);
  }, [activeJob?.id]);

  const { lastMessage: jobUpdate, connected } = useWebSocket<JobProgressMessage>(
    activeJob ? `/ws/jobs/${activeJob.id}` : null,
    (msg) => {
      if (!msg.recent_events?.length || msg.job_id !== activeJobIdRef.current) return;
      setLiveEvents((prev) => {
        const byId = new Map(prev.map((e) => [e.id, e]));
        for (const e of msg.recent_events) byId.set(e.id, e);
        return Array.from(byId.values()).sort((a, b) => a.timestamp_seconds - b.timestamp_seconds || a.id - b.id);
      });
    }
  );

  // Once a job finishes, pull the full per-track breakdown (confidence,
  // observation count, risk score). The WebSocket only carries the
  // lightweight running class-count totals while processing.
  const { data: detections } = useQuery({
    queryKey: ["job-detections", activeJob?.id],
    queryFn: async () =>
      (await apiClient.get<JobDetectionsSummary>(`/api/jobs/${activeJob!.id}/detections`)).data,
    enabled: !!activeJob && activeJob.status === "completed",
  });

  // Per-frame detection boxes for the overlay drawn on the video. Fetched
  // incrementally (only boxes newer than the last one received), every
  // second while the job runs, plus one last pull after it finishes.
  const [boxes, setBoxes] = useState<DetectionBox[]>([]);
  const jobLiveRef = useRef(false);
  useEffect(() => {
    setBoxes([]);
    if (!activeJob) return;
    const jobId = activeJob.id;
    let cancelled = false;
    let lastId = 0;
    let timer: number | undefined;
    const pull = async () => {
      const wasLive = jobLiveRef.current;
      try {
        for (;;) {
          const page = (
            await apiClient.get<DetectionBox[]>(`/api/jobs/${jobId}/boxes`, { params: { after_id: lastId } })
          ).data;
          if (cancelled) return;
          if (page.length) {
            lastId = page[page.length - 1].id;
            setBoxes((prev) => prev.concat(page));
          }
          if (page.length < 5000) break; // a full page means there's more
        }
      } catch {
        // transient network error: the next pull retries from the same cursor
      }
      if (!cancelled && (jobLiveRef.current || wasLive)) timer = window.setTimeout(pull, 1000);
    };
    pull();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeJob?.id]);

  // Full canonical event log once the job completes (the WebSocket only
  // ever carries the newest ~15 events while processing).
  const { data: finalEvents } = useQuery({
    queryKey: ["job-events", activeJob?.id],
    queryFn: async () => (await apiClient.get<ActivityEvent[]>(`/api/jobs/${activeJob!.id}/events`)).data,
    enabled: !!activeJob && activeJob.status === "completed",
  });


  const allEvents = activeJob?.status === "completed" ? finalEvents ?? liveEvents : liveEvents;
  // During a playback session, reveal each event when the playhead reaches
  // its timestamp; otherwise (reviewing a finished job) show the full log.
  const events = session ? allEvents.filter((e) => e.timestamp_seconds <= playhead + 0.25) : allEvents;

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [events.length]);

  // Opening the page on a job that's already running (e.g. right after an
  // upload) starts a session too, so narration follows playback there as
  // well. Muted, since there's no user gesture to allow sound.
  const autoStartedForJobRef = useRef<number | null>(null);
  useEffect(() => {
    if (!activeJob || !isLive || session || autoStartedForJobRef.current === activeJob.id) return;
    autoStartedForJobRef.current = activeJob.id;
    if (videoRef.current) videoRef.current.muted = true;
    startPlaybackSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeJob?.id, isLive]);

  const { data: incidents } = useQuery({
    queryKey: ["incidents-for-job", activeJob?.id],
    queryFn: async () =>
      (
        await apiClient.get<{ items: Incident[] }>("/api/incidents", {
          params: { processing_job_id: activeJob!.id, page_size: 50 },
        })
      ).data.items,
    enabled: !!activeJob,
    refetchInterval: isLive ? 5000 : false,
  });

  useEffect(() => {
    if (activeJob?.status === "completed" || activeJob?.status === "failed") {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
    }
  }, [activeJob?.status, queryClient, videoId]);

  // Ignore a WebSocket message still lingering from the previous job.
  const update = jobUpdate?.job_id === activeJob?.id ? jobUpdate : null;
  const liveStatus = update?.status ?? activeJob?.status;
  const liveProgress = update?.progress_percent ?? activeJob?.progress_percent ?? 0;
  jobLiveRef.current = liveStatus === "pending" || liveStatus === "processing";

  // How far into the footage the pipeline has analyzed: frames are
  // analyzed strictly in order and progress is the fraction of frames done
  // (see process_video_task).
  const duration = video?.duration_seconds ?? 0;
  const analyzedUntil =
    liveStatus === "completed" || liveStatus === "failed"
      ? Infinity
      : liveStatus === "processing"
      ? (Math.min(liveProgress, 100) / 100) * duration
      : 0;

  // Hold playback at the analysis frontier; resume once it moves ahead.
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !session) return;
    if (!el.paused && !heldForAnalysis && analyzedUntil < duration && playhead > analyzedUntil) {
      autoPausingRef.current = true;
      el.pause();
      setHeldForAnalysis(true);
    } else if (heldForAnalysis && (analyzedUntil >= duration || analyzedUntil > playhead + 1)) {
      setHeldForAnalysis(false);
      el.play().catch(() => undefined);
    }
  }, [session, playhead, analyzedUntil, duration, heldForAnalysis]);

  const liveCounts = update?.class_counts ?? detections?.class_counts ?? {};
  const liveTotal = update?.total_tracked_objects ?? detections?.total_tracked_objects ?? 0;
  const classEntries = Object.entries(liveCounts).sort((a, b) => b[1] - a[1]);

  const worstSeverity = events.reduce<EventSeverity>((worst, e) => {
    const rank: Record<EventSeverity, number> = { low: 0, medium: 1, high: 2, critical: 3 };
    return rank[e.severity] > rank[worst] ? e.severity : worst;
  }, "low");

  const previewSrc = videoId ? authenticatedStreamUrl(`/api/videos/${videoId}/stream`) : undefined;

  // Detection boxes drawn live over the video, synced to video.currentTime,
  // from the moment each object is tracked.
  const showLiveOverlay = boxes.length > 0;

  const handleDelete = () => {
    if (window.confirm(`Delete "${video?.original_filename ?? "this video"}"? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={video?.original_filename ?? "Video"}
        actions={
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="shrink-0 rounded-full border border-status-critical/40 text-status-critical text-sm font-medium px-3 py-1.5 hover:bg-status-critical/10 disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete Video"}
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="vivid-card bg-loud-lime/55 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-black">Preview</h2>
              {showLiveOverlay && (
                <span className="text-xs font-medium text-black border border-black/30 rounded-full px-2 py-0.5">
                  Detection overlay
                </span>
              )}
            </div>
            {previewSrc ? (
              <div className="relative">
                <video
                  key={previewSrc}
                  ref={videoRef}
                  controls
                  playsInline
                  className="w-full rounded-xl bg-black aspect-video"
                  src={previewSrc}
                  onTimeUpdate={(e) => setPlayhead(e.currentTarget.currentTime)}
                  onSeeked={(e) => setPlayhead(e.currentTarget.currentTime)}
                  onPause={() => {
                    // A manual pause cancels the auto-resume.
                    if (autoPausingRef.current) autoPausingRef.current = false;
                    else setHeldForAnalysis(false);
                  }}
                  onEnded={() => {
                    setSession(false);
                    setHeldForAnalysis(false);
                  }}
                />
                {session && heldForAnalysis && (
                  <div className="pointer-events-none absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/75 text-white text-xs font-medium px-3 py-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    {liveStatus === "pending" ? "Starting analysis…" : "Waiting for analysis to catch up…"}
                  </div>
                )}
                <DetectionOverlay
                  videoRef={videoRef}
                  boxes={boxes}
                  sourceWidth={video?.width ?? 0}
                  sourceHeight={video?.height ?? 0}
                  active={showLiveOverlay}
                />
              </div>
            ) : (
              <div className="aspect-video bg-black rounded-xl flex items-center justify-center text-white/60 text-sm">
                No video available.
              </div>
            )}
            {!showLiveOverlay && (
              <p className="mt-2 text-xs text-black/60">
                {isLive
                  ? "Detection boxes will appear here as the video is analyzed."
                  : "Run analysis to see detection boxes over the video."}
              </p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-black/70 tabular">
              <span>Duration: {video?.duration_seconds?.toFixed(0) ?? "-"}s</span>
              <span>FPS: {video?.fps?.toFixed(1) ?? "-"}</span>
              <span>Resolution: {video?.width && video?.height ? `${video.width}x${video.height}` : "-"}</span>
            </div>
            <button
              onClick={() => reprocessMutation.mutate()}
              disabled={isLive || reprocessMutation.isPending}
              className="mt-4 rounded-full bg-black text-white font-display font-semibold text-sm px-4 py-2 hover:bg-black/80 disabled:opacity-50 press"
            >
              {isLive ? "Analyzing…" : "Reprocess Video"}
            </button>
          </div>

          <div className="vivid-card bg-loud-jade/55 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-black">Analysis Status</h2>
              {isLive && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  {connected ? "live" : "connecting…"}
                </span>
              )}
            </div>
            {!activeJob && <p className="text-sm text-black/60">No analysis job yet.</p>}
            {activeJob && (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className={liveStatus === "failed" ? "text-red-900 font-semibold" : "text-black font-medium"}>
                    <FlipValue value={statusLabel[liveStatus ?? "pending"]} />
                  </span>
                  <span className="tabular text-black/60">
                    <FlipValue value={`${liveProgress.toFixed(0)}%`} />
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-black/15 overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-300 ${
                      liveStatus === "failed" ? "bg-red-900" : "bg-black"
                    }`}
                    style={{ width: `${Math.max(liveStatus === "failed" ? 100 : liveProgress, 2)}%` }}
                  />
                </div>
                {liveStatus === "failed" && (update?.error_message ?? activeJob.error_message) && (
                  <p className="mt-2 text-xs text-red-900 font-medium">
                    {update?.error_message ?? activeJob.error_message}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="vivid-card bg-loud-indigo/80 p-4">
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-3">
              Detected {liveTotal > 0 && <span className="tabular text-white/80">({liveTotal})</span>}
            </h2>
            {classEntries.length === 0 && (
              <p className="text-sm text-white/70">
                {isLive
                  ? "Watching for people and vehicles in the footage…"
                  : "Nothing detected yet. Run analysis to find out what's in this video."}
              </p>
            )}
            {classEntries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {classEntries.map(([objectClass, count]) => (
                  <span
                    key={objectClass}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${objectClassChip(objectClass)}`}
                  >
                    <span className={`capitalize font-semibold ${objectClassColor(objectClass)}`}>{objectClass}</span>
                    <span className={`tabular font-semibold ${objectClassColor(objectClass)}`}>
                      <FlipValue value={count} />
                    </span>
                  </span>
                ))}
              </div>
            )}

            {detections && detections.tracks.length > 0 && (
              <div className="overflow-x-auto mt-4">
                <table className="w-full min-w-[480px] text-sm">
                  <thead className="text-white/70 text-left text-xs tracking-[-0.01em]">
                    <tr>
                      <th className="py-2 pr-2">Track</th>
                      <th className="py-2 pr-2">Class</th>
                      <th className="py-2 pr-2">Color</th>
                      <th className="py-2 pr-2">Confidence</th>
                      <th className="py-2 pr-2">Observations</th>
                      <th className="py-2">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detections.tracks.map((t) => (
                      <tr key={t.track_number} className="border-t border-white/15 text-white">
                        <td className="py-2 pr-2 tabular">#{t.track_number}</td>
                        <td className="py-2 pr-2 capitalize">{t.object_class}</td>
                        <td className="py-2 pr-2 capitalize text-white/70">
                          {t.dominant_color !== "unknown" ? t.dominant_color : "-"}
                        </td>
                        <td className="py-2 pr-2 tabular">
                          {t.max_confidence !== null ? `${(t.max_confidence * 100).toFixed(0)}%` : "-"}
                        </td>
                        <td className="py-2 pr-2 tabular">{t.observation_count}</td>
                        <td className="py-2 tabular font-semibold">{t.final_risk_score.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: live activity narration, the primary surface for
            "what's happening right now", with incidents below it. */}
        <div className="space-y-4">
          <div className="vivid-card bg-loud-violet/60 p-4 flex flex-col max-h-[640px]">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white">Activity Log</h2>
              {worstSeverity !== "low" && (
                <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full border ${severityStyle[worstSeverity]}`}>
                  {worstSeverity}
                </span>
              )}
            </div>
            <ActivityLog
              events={events}
              emptyMessage={isLive ? "Watching the footage. Activity will appear here as detections are processed." : "No activity recorded yet."}
              logEndRef={logEndRef}
            />
          </div>

          <div className="vivid-card bg-loud-magenta/80 p-4">
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-white mb-3">Incidents</h2>
            <ul className="space-y-2 text-sm">
              {incidents?.length === 0 && <p className="text-white/60">No incidents detected.</p>}
              {incidents?.map((incident) => (
                <li key={incident.id} className="border-b border-white/15 pb-2 last:border-0">
                  <p className="text-white">{incident.summary}</p>
                  <p className="text-xs text-red-400 font-semibold">
                    Risk: <FlipValue value={incident.risk_score.toFixed(1)} />
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
