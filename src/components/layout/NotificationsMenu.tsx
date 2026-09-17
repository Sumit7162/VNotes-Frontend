import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Bell, CheckCircle, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { videosApi } from "../../services/videos";
import { formatDateTime } from "../../utils/datetime";
import type { Video, VideoListResponse } from "../../types";

/**
 * Recent activity, built from the videos this account has actually submitted.
 *
 * There is no notifications API, and inventing one would mean either changing
 * the backend or showing made-up messages. So this reports something real
 * instead: what each recent video is doing. The badge counts the ones still
 * being processed, which is the only thing here that genuinely wants attention.
 */
export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Polls only while something is in flight, and only while the panel is open;
  // the badge count comes from the cached copy the rest of the time.
  const { data, isLoading } = useQuery<VideoListResponse>({
    queryKey: ["videos", "activity"],
    queryFn: () => videosApi.list(5, 0),
    refetchInterval: (query) => {
      const videos = query.state.data?.videos ?? [];
      const busy = videos.some((v) => v.status !== "completed" && v.status !== "failed");
      return busy ? 5000 : false;
    },
    staleTime: 15_000,
  });

  const videos = data?.videos ?? [];
  const processingCount = videos.filter(
    (video) => video.status !== "completed" && video.status !== "failed",
  ).length;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const describe = (video: Video) => {
    if (video.status === "completed") {
      return { icon: CheckCircle, tone: "text-success-600", text: "Notes are ready" };
    }
    if (video.status === "failed") {
      return { icon: AlertCircle, tone: "text-danger-600", text: "Processing failed" };
    }
    return { icon: Loader2, tone: "text-accent-600 animate-spin", text: "Being processed" };
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={
          processingCount > 0
            ? `Activity, ${processingCount} video${processingCount === 1 ? "" : "s"} processing`
            : "Activity"
        }
        className={cn(
          "relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900",
          isOpen && "bg-paper-200 text-ink-900",
        )}
      >
        <Bell className="h-[18px] w-[18px]" />
        {processingCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Recent activity"
          className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] origin-top-right animate-[menu-in_120ms_ease-out] overflow-hidden rounded-xl border border-line bg-paper-50 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Recent activity</p>
            {processingCount > 0 && (
              <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
                {processingCount} processing
              </span>
            )}
          </div>

          {isLoading ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">Loading…</p>
          ) : videos.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">
              Nothing here yet. Process a video to see its progress.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {videos.map((video) => {
                const { icon: Icon, tone, text } = describe(video);
                return (
                  <li key={video.id}>
                    <Link
                      to={video.status === "completed" ? `/notes/${video.id}` : "/dashboard"}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-paper-200"
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} aria-hidden="true" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-900">
                          {video.title || "Untitled video"}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          {text} · {formatDateTime(video.created_at)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
