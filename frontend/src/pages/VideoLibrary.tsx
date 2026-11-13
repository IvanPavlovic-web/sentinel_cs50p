import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import type { VideoSource, VideoUploadResponse } from "../types";
import PageHeader from "../components/PageHeader";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value.toFixed(1)} ${units[unit]}`;
}

export default function VideoLibrary() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadSize, setUploadSize] = useState<{ loaded: number; total: number } | null>(null);

  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => (await apiClient.get<VideoSource[]>("/api/videos")).data,
    refetchInterval: 8000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.post<VideoUploadResponse>("/api/videos/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        // No axios timeout is set globally, and large footage (multi-GB,
        // multi-hour recordings) can legitimately take a long time to
        // transfer, so progress feedback matters more here than a timeout.
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
            setUploadSize({ loaded: evt.loaded, total: evt.total });
          }
        },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      // Jump straight to the video's live analysis view: processing has
      // already been queued by the upload endpoint, so the user watches
      // detection happen in real time instead of waiting on this list.
      navigate(`/videos/${res.data.video_source.id}`);
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Upload failed. Check file type and try again.";
      setError(detail);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: number) => apiClient.delete(`/api/videos/${videoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  const handleDelete = (video: VideoSource) => {
    if (window.confirm(`Delete "${video.original_filename}"? This cannot be undone.`)) {
      deleteMutation.mutate(video.id);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setProgress(0);
    setUploadSize(null);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadSize(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Video Library"
        actions={
          <label
            className={`cursor-pointer rounded-full bg-ops-accent text-ops-bg font-display font-semibold text-sm px-4 py-2 transition-colors hover:bg-ops-accentDim press ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploading ? "Uploading…" : "Upload Video"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp4,.avi,.mov,.mkv,.ts,.mxf,.webm"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        }
      />

      {uploading && (
        <div className="vivid-card bg-loud-lime/55 px-5 py-4">
          <div className="flex items-center justify-between text-xs text-black/60 mb-2">
            <span>Transferring to server, no file-size limit applies</span>
            <span className="tabular text-black font-medium">
              {uploadSize ? `${formatBytes(uploadSize.loaded)} / ${formatBytes(uploadSize.total)}` : ""}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-black/15 overflow-hidden">
            <div
              className="h-full bg-black transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-status-critical">{error}</p>}

      <div className="vivid-card bg-loud-indigo/80 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left">
            <tr>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Filename</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Size</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Duration</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Resolution</th>
              <th className="px-4 pt-4 pb-2.5 text-xs font-medium text-white/70 tracking-[-0.01em]">Uploaded</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-3 text-white/70" colSpan={6}>
                  Loading…
                </td>
              </tr>
            )}
            {videos?.map((video) => (
              <tr key={video.id} className="border-t border-white/15 hover:bg-white/[0.06]">
                <td className="px-4 py-3 text-white">{video.original_filename}</td>
                <td className="px-4 py-3 tabular text-white/70">
                  {video.file_size_bytes ? formatBytes(video.file_size_bytes) : "-"}
                </td>
                <td className="px-4 py-3 tabular text-white">{video.duration_seconds ? `${video.duration_seconds.toFixed(0)}s` : "-"}</td>
                <td className="px-4 py-3 tabular text-white">
                  {video.width && video.height ? `${video.width}x${video.height}` : "-"}
                </td>
                <td className="px-4 py-3 text-white/70">{new Date(video.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <Link to={`/videos/${video.id}`} className="text-white font-medium hover:underline">
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(video)}
                    disabled={deleteMutation.isPending}
                    className="ml-3 text-red-200 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {videos?.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-white/70" colSpan={6}>
                  No videos uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
