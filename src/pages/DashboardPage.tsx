import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

import { useVideos } from "../hooks/useVideos";
import { useUsage } from "../hooks/useUsage";
import { useAuth } from "../hooks/useAuth";
import { VideoRow } from "../components/VideoRow";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { YOUTUBE_SUBMISSION_LOCKED } from "@/lib/features";
import type { VideoStatus } from "../types";

const stageOrder: VideoStatus[] = [
  "pending",
  "downloading",
  "extracting_audio",
  "transcribing",
  "generating_notes",
];

const stageLabels: Record<VideoStatus, string> = {
  pending: "Waiting in the queue",
  downloading: "Fetching the transcript",
  extracting_audio: "Fetching the transcript",
  transcribing: "Transcribing",
  generating_notes: "Writing the notes",
  completed: "Notes ready",
  failed: "Processing failed",
};

/** "Good morning" / "afternoon" / "evening", from the reader's own clock. */
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The first name only - a full legal name in a greeting reads as a form. */
function firstName(fullName: string | null | undefined): string | null {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || null;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const name = firstName(user?.full_name);
  const hadActiveVideo = useRef(false);

  const {
    data: videosData,
    isLoading: videosLoading,
    isFetching: videosFetching,
    isError: videosError,
    error: videosErrorDetail,
  } = useVideos(8);

  const videos = videosData?.videos ?? [];
  const activeVideo = videos.find(
    (video) => video.status !== "completed" && video.status !== "failed",
  );
  const hasActiveVideo = !!activeVideo;

  // Only polled while something is in flight; the rest of the time the cached
  // copy is what the standfirst reads from.
  const { data: usage } = useUsage(hasActiveVideo ? 10000 : false);

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

  const total = videosData?.total ?? 0;
  const doneToday =
    (usage?.today?.videos_processed ?? 0) + (usage?.today?.short_videos_processed ?? 0);

  // One line of real figures in place of a row of stat cards. The numbers are
  // worth knowing; five bordered boxes to hold three of them were not.
  const standfirst = [
    total > 0 ? `${total} ${total === 1 ? "set of notes" : "sets of notes"}` : null,
    doneToday > 0 ? `${doneToday} today` : null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl">
      {/* ---- Masthead ---------------------------------------------------- */}
      <header className="pb-7">
        <p className="overline">Library</p>
        <h1 className="page-title mt-2 text-[32px] leading-[1.15] sm:text-[38px]">
          {greeting()}
          {name ? `, ${name}` : ""}.
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
          {standfirst.length > 0
            ? standfirst.join(" · ")
            : "Nothing here yet — the first set of notes is a transcript away."}
        </p>
      </header>

      {/* ---- Start something --------------------------------------------- */}
      <section className="rule pt-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink-900">
              {YOUTUBE_SUBMISSION_LOCKED
                ? "Turn a transcript into notes"
                : "Turn a video into notes"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {YOUTUBE_SUBMISSION_LOCKED
                ? "Paste the text or drop a .txt, .md, .srt or .vtt file. No length limit."
                : "Paste a YouTube link, or bring a transcript of your own."}
            </p>
          </div>
          <Link
            to="/submit"
            className="btn-primary inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors"
          >
            {YOUTUBE_SUBMISSION_LOCKED ? "Upload a transcript" : "Process a video"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* ---- In progress -------------------------------------------------- */}
      {activeVideo && (
        <section className="mt-7 rounded-lg border border-line bg-paper-200/60 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin text-accent-600"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">
                {activeVideo.title || "Processing"}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">
                {stageLabels[activeVideo.status]}
                {stageOrder.includes(activeVideo.status) && (
                  <span className="text-ink-400">
                    {" · "}
                    step {Math.max(1, stageOrder.indexOf(activeVideo.status))} of 3
                  </span>
                )}
              </p>
            </div>
            {videosFetching && (
              <span className="hidden shrink-0 text-xs text-ink-400 sm:block">Updating…</span>
            )}
          </div>
        </section>
      )}

      {videosError && (
        <div className="mt-7 flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
          <div>
            <p className="text-sm font-medium text-danger-800">
              The library could not be loaded
            </p>
            <p className="mt-1 text-xs leading-relaxed text-danger-600">
              {videosErrorDetail instanceof Error
                ? videosErrorDetail.message
                : "Check that the backend is running and your session is still valid."}
            </p>
          </div>
        </div>
      )}

      {/* ---- Recent ------------------------------------------------------- */}
      <section className="mt-10">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="overline">Recent</h2>
          {videos.length > 0 && (
            <Link
              to="/notes"
              className="text-sm text-ink-500 underline-offset-4 transition-colors hover:text-ink-900 hover:underline"
            >
              All notes
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="rule mt-3 py-14 text-center">
            <p className="font-display text-lg font-semibold tracking-[-0.01em] text-ink-900">
              Nothing processed yet
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
              {YOUTUBE_SUBMISSION_LOCKED
                ? "Bring a transcript and the notes are written for you."
                : "Submit a video and the notes are written for you."}
            </p>
            <Link
              to="/submit"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 underline-offset-4 transition-colors hover:text-accent-700 hover:underline"
            >
              Start the first one
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          // The rule on each row supplies the separator, and a closing line
          // under the last one bounds the list top and bottom.
          <div className="mt-3 border-b border-line">
            {videos.map((video) => (
              <VideoRow key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
