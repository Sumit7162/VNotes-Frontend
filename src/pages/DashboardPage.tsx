import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useVideos } from "../hooks/useVideos";
import { useAuth } from "../hooks/useAuth";
import { VideoCard } from "../components/VideoCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { FileText, ArrowRight, AlertCircle, CheckCircle, Circle, Loader2, Video } from "lucide-react";
import { Link } from "react-router-dom";
import type { VideoStatus } from "../types";

const processingSteps: Array<{ status: VideoStatus; label: string }> = [
  { status: "pending", label: "Queued" },
  { status: "transcribing", label: "Transcript" },
  { status: "generating_notes", label: "Notes" },
  { status: "completed", label: "Done" },
];

const activeStatusLabels: Record<VideoStatus, string> = {
  pending: "Waiting in queue",
  downloading: "Fetching transcript",
  extracting_audio: "Fetching transcript",
  transcribing: "Creating transcript",
  generating_notes: "Generating notes",
  completed: "Notes ready",
  failed: "Processing failed",
};

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const displayName = user?.full_name || "User";
  const hadActiveVideo = useRef(false);
  const {
    data: videosData,
    isLoading: videosLoading,
    isFetching: videosFetching,
    isError: videosError,
    error: videosErrorDetail,
  } = useVideos(10);
  const hasActiveVideo = videosData?.videos.some(
    (video) => video.status !== "completed" && video.status !== "failed"
  ) ?? false;
  const activeVideo = videosData?.videos.find(
    (video) => video.status !== "completed" && video.status !== "failed"
  );
  const activeStepIndex = Math.max(
    0,
    processingSteps.findIndex((step) => step.status === activeVideo?.status)
  );

  useEffect(() => {
    if (hadActiveVideo.current && !hasActiveVideo) {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
    hadActiveVideo.current = hasActiveVideo;
  }, [hasActiveVideo, queryClient]);

  if (videosLoading && !videosData) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900">Welcome back, {displayName}</h2>
        <p className="text-sm text-ink-500 mt-1.5">
          Overview of your video processing activity
        </p>
      </div>

      {/* The one action this page exists for, in the space the usage cards used
          to fill. The remaining quota is still on the submit page, where it is
          about to matter, and on the profile page. */}
      <Link
        to="/submit"
        className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-8 text-lg font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-accent-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 sm:py-10 sm:text-xl"
      >
        <Video className="h-6 w-6 flex-shrink-0" aria-hidden="true" />
        Process New Video
        <ArrowRight className="h-5 w-5 flex-shrink-0 transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
      </Link>

      {activeVideo && (
        <div className="rounded-2xl border border-accent-100 bg-accent-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-700">
                Current processing
              </p>
              <h3 className="mt-1 truncate text-sm font-semibold text-ink-900">
                {activeVideo.title || "Processing video"}
              </h3>
              <p className="mt-1 text-xs text-ink-600">
                {activeStatusLabels[activeVideo.status]}
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-6 lg:w-[560px]">
              {processingSteps.map((step, index) => {
                const isCurrent = index === activeStepIndex;
                const isDone = index < activeStepIndex;

                return (
                  <div
                    key={step.status}
                    className="flex min-w-0 items-center gap-1.5 text-xs font-medium"
                  >
                    {isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-accent-600" />
                    ) : isDone ? (
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-success-600" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 flex-shrink-0 text-ink-300" />
                    )}
                    <span
                      className={
                        isCurrent
                          ? "truncate text-accent-700"
                          : isDone
                            ? "truncate text-ink-700"
                            : "truncate text-ink-400"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {videosError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-600" />
            <div>
              <p className="text-sm font-medium text-danger-800">
                Dashboard data could not be loaded
              </p>
              <p className="mt-1 text-xs text-danger-600">
                {videosErrorDetail instanceof Error
                  ? videosErrorDetail.message
                  : "Please check that the backend is running and your login token is valid."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900">Recent Videos</h3>
            {hasActiveVideo && (
              <p className="text-xs text-ink-500">
                Processing progress updates automatically while this page stays open.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {videosFetching && hasActiveVideo && (
              <span className="text-xs font-medium text-accent-600">Updating status...</span>
            )}
            {/* The sidebar used to carry this. Shown unconditionally now, where
                the old "View All" appeared only past ten videos - otherwise the
                notes list has no way in from the dashboard at all. */}
            <Link
              to="/notes"
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper-50 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-accent-300 hover:text-accent-700"
            >
              <FileText className="h-4 w-4" />
              My Notes
              {videosData && videosData.total > 0 && (
                <span className="font-normal text-ink-500">({videosData.total})</span>
              )}
            </Link>
          </div>
        </div>

        {!videosData || videosData.videos.length === 0 ? (
          <div className="bg-paper-50 rounded-xl border border-line p-12 text-center">
            <FileText className="h-12 w-12 text-ink-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-ink-900 mb-2">
              No videos yet
            </h4>
            <p className="text-sm text-ink-500 mb-4">
              Submit a YouTube video to get started with AI-powered note-taking.
            </p>
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Submit Your First Video
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {videosData.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
