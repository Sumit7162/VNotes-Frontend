import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle,
  Circle,
  Clock,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import { useVideos } from "../hooks/useVideos";
import { useAuth } from "../hooks/useAuth";
import { submissionErrorMessage, useVideoSubmission } from "../hooks/useVideoSubmission";
import { VideoCard } from "../components/VideoCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { cn } from "@/lib/utils";
import {
  YOUTUBE_LOCK_MESSAGE,
  YOUTUBE_LOCK_SHORT,
  YOUTUBE_SUBMISSION_LOCKED,
} from "@/lib/features";
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

const highlights = [
  { icon: Brain, title: "AI-Powered", body: "Get accurate summaries" },
  { icon: FileText, title: "Structured Notes", body: "Well organized & easy to read" },
  { icon: Clock, title: "Save Time", body: "Learn faster, smarter" },
  { icon: ShieldCheck, title: "Private & Secure", body: "Your content stays yours" },
];

/** The three stages of the pipeline, as the hero illustrates them. */
const pipeline = [
  { icon: Video, caption: "Video" },
  { icon: Sparkles, caption: "AI Analysis" },
  { icon: FileText, caption: "Structured Notes" },
];

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const displayName = user?.full_name || "there";
  const hadActiveVideo = useRef(false);

  const [url, setUrl] = useState("");
  const { youtube } = useVideoSubmission();

  const {
    data: videosData,
    isLoading: videosLoading,
    isFetching: videosFetching,
    isError: videosError,
    error: videosErrorDetail,
  } = useVideos(10);

  const hasActiveVideo =
    videosData?.videos.some(
      (video) => video.status !== "completed" && video.status !== "failed",
    ) ?? false;
  const activeVideo = videosData?.videos.find(
    (video) => video.status !== "completed" && video.status !== "failed",
  );
  const activeStepIndex = Math.max(
    0,
    processingSteps.findIndex((step) => step.status === activeVideo?.status),
  );

  useEffect(() => {
    if (hadActiveVideo.current && !hasActiveVideo) {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
    hadActiveVideo.current = hasActiveVideo;
  }, [hasActiveVideo, queryClient]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || youtube.isPending) return;
    youtube.mutate({ youtube_url: trimmed }, { onSuccess: () => setUrl("") });
  };

  if (videosLoading && !videosData) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="page-title text-2xl sm:text-3xl">
            Welcome back, {displayName} <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Turn YouTube videos into clean, structured notes with AI.
          </p>
        </div>
        <p className="hidden shrink-0 text-right font-display text-sm italic leading-snug text-ink-400 md:block">
          “Small videos,
          <br />
          big ideas.”
        </p>
      </header>

      {/* ---- Hero ------------------------------------------------------- */}
      <section className="hero-surface relative overflow-hidden rounded-2xl">
        <div className="hero-grid absolute inset-0 opacity-50" aria-hidden="true" />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center lg:gap-10">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80 ring-1 ring-inset ring-white/20">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI note generation
            </span>

            <h2 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-[28px]">
              Create Notes from Any YouTube Video
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">
              {YOUTUBE_SUBMISSION_LOCKED
                ? "Upload a transcript and let AI generate a clear, structured summary for you."
                : "Paste a YouTube link and let AI generate a clear, structured summary for you."}
            </p>

            {YOUTUBE_SUBMISSION_LOCKED ? (
              <div className="mt-5">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  {/* Kept as a real, visibly disabled field rather than removed:
                      the capability is coming back, and an input that vanishes
                      is harder to understand than one that says it is locked. */}
                  <div className="relative min-w-0 flex-1">
                    <Lock
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                      aria-hidden="true"
                    />
                    <input
                      type="text"
                      value=""
                      readOnly
                      disabled
                      aria-label={YOUTUBE_LOCK_SHORT}
                      placeholder={YOUTUBE_LOCK_SHORT}
                      className="h-11 w-full cursor-not-allowed rounded-lg border border-white/15 bg-night-900/25 pl-10 pr-3.5 text-sm text-white/50 placeholder:text-white/40"
                    />
                  </div>
                  <Link
                    to="/submit"
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-accent-700 shadow-sm transition-colors hover:bg-white/90"
                  >
                    Upload a transcript
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>

                <p className="mt-3 flex items-start gap-2 rounded-lg bg-night-900/30 px-3 py-2 text-xs leading-relaxed text-white/75 ring-1 ring-inset ring-white/15">
                  <Lock className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {YOUTUBE_LOCK_MESSAGE}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5">
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <label htmlFor="hero-url" className="sr-only">
                    YouTube video URL
                  </label>
                  <input
                    id="hero-url"
                    type="url"
                    inputMode="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    disabled={youtube.isPending}
                    placeholder="Paste YouTube video URL here..."
                    className="h-11 min-w-0 flex-1 rounded-lg border border-white/20 bg-night-900/35 px-3.5 text-sm text-white placeholder:text-white/45 transition-colors focus:border-white/45 focus:outline-none focus:ring-2 focus:ring-white/25 disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={!url.trim() || youtube.isPending}
                    className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-accent-700 shadow-sm transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {youtube.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Processing…
                      </>
                    ) : (
                      <>
                        Process Video
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>

                {youtube.isError && (
                  <p
                    role="alert"
                    className="mt-3 flex items-start gap-2 rounded-lg bg-night-900/40 px-3 py-2 text-xs text-white ring-1 ring-inset ring-white/20"
                  >
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {submissionErrorMessage(
                      youtube.error,
                      "That video could not be submitted. Check the link and try again.",
                    )}
                  </p>
                )}

                <p className="mt-3 text-xs text-white/55">
                  Have a transcript instead?{" "}
                  <Link
                    to="/submit"
                    className="font-medium text-white underline underline-offset-2 hover:text-white/80"
                  >
                    Upload it here
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>

          {/* The pipeline, stated plainly. Kept small and monochrome so it
              explains the product without competing with the input. */}
          <ul className="hidden lg:block" aria-hidden="true">
            {pipeline.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <li key={stage.caption}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
                      <Icon className="h-[18px] w-[18px] text-white/90" />
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-white/35" />
                    <span className="truncate font-display text-sm italic text-white/85">
                      {stage.caption}
                    </span>
                  </div>
                  {index < pipeline.length - 1 && (
                    <span className="ml-[22px] block h-4 w-px bg-white/20" />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ---- Quick features --------------------------------------------- */}
      <section
        aria-label="What V-Notes AI does"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="surface-card flex items-start gap-3 p-3.5 transition-colors hover:border-line-strong"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink-900">{item.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                  {item.body}
                </span>
              </span>
            </div>
          );
        })}
      </section>

      {/* ---- Current processing ----------------------------------------- */}
      {activeVideo && (
        <section className="rounded-xl border border-accent-200 bg-accent-50 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-700">
                Current processing
              </p>
              <h3 className="mt-1 truncate text-sm font-semibold text-ink-900">
                {activeVideo.title || "Processing video"}
              </h3>
              <p className="mt-0.5 text-xs text-ink-600">
                {activeStatusLabels[activeVideo.status]}
              </p>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[460px]">
              {processingSteps.map((step, index) => {
                const isCurrent = index === activeStepIndex;
                const isDone = index < activeStepIndex;

                return (
                  <div
                    key={step.status}
                    className="flex min-w-0 items-center gap-1.5 text-xs font-medium"
                  >
                    {isCurrent ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent-600" />
                    ) : isDone ? (
                      <CheckCircle className="h-3.5 w-3.5 shrink-0 text-success-600" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                    )}
                    <span
                      className={cn(
                        "truncate",
                        isCurrent
                          ? "text-accent-700"
                          : isDone
                            ? "text-ink-700"
                            : "text-ink-400",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {videosError && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" />
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

      {/* ---- Recent videos ----------------------------------------------- */}
      <section>
        <div className="mb-3.5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-ink-900">Recent Videos</h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {hasActiveVideo
                ? "Progress updates automatically while this page stays open."
                : "Your latest processed videos and notes"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {videosFetching && hasActiveVideo && (
              <span className="text-xs font-medium text-accent-600">Updating…</span>
            )}
            <Link
              to="/notes"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {!videosData || videosData.videos.length === 0 ? (
          <div className="surface-card flex flex-col items-center px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper-200 text-ink-400">
              <Upload className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3.5 text-base font-semibold text-ink-900">
              No videos processed yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-ink-500">
              Submit a YouTube video to get started with AI-powered note-taking.
            </p>
            <Link
              to="/submit"
              className="btn-primary mt-5 inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors"
            >
              Submit Your First Video
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {videosData.videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
