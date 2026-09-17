import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Cpu,
  FileText,
  Lightbulb,
  Link2,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Tag,
  UploadCloud,
  Video,
  X,
  Zap,
} from "lucide-react";

import { useUsage } from "../hooks/useUsage";
import { submissionErrorMessage, useVideoSubmission } from "../hooks/useVideoSubmission";
import { YOUTUBE_LOCK_MESSAGE, YOUTUBE_SUBMISSION_LOCKED } from "@/lib/features";
import { cn } from "@/lib/utils";

type Mode = "youtube" | "transcript";

// There is no limit on how long an uploaded transcript may be. This matches
// the backend's sanity ceiling on the request body - set well past any real
// transcript - so a runaway paste is caught here rather than over the wire.
const MAX_TRANSCRIPT_CHARS = 2_000_000;
const MIN_TRANSCRIPT_CHARS = 200;
const ACCEPTED_EXTENSIONS = [".txt", ".text", ".md", ".srt", ".vtt"];

const benefits = [
  { icon: Zap, title: "Save Time", body: "Get key insights in minutes, not hours." },
  {
    icon: BookOpen,
    title: "Better Learning",
    body: "Structured notes help you understand and remember faster.",
  },
  {
    icon: ShieldCheck,
    title: "Your Content",
    body: "Private, secure and only accessible to you.",
  },
];

export function VideoSubmitPage() {
  const [mode, setMode] = useState<Mode>(
    YOUTUBE_SUBMISSION_LOCKED ? "transcript" : "youtube",
  );
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: usageData } = useUsage();
  const { youtube: processMutation, transcript: transcriptMutation } = useVideoSubmission();

  const activeMutation = mode === "youtube" ? processMutation : transcriptMutation;

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    if (next === "youtube" && YOUTUBE_SUBMISSION_LOCKED) return;
    setMode(next);
    setFileError(null);
    // Clear the other tab's failed attempt so its error does not hang around
    // over a form the user has moved on from.
    processMutation.reset();
    transcriptMutation.reset();
  };

  const readFile = (file: File) => {
    setFileError(null);

    const lower = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setFileError(`Unsupported file type. Use ${ACCEPTED_EXTENSIONS.join(", ")}.`);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () =>
      setFileError("Could not read that file. Try pasting the text instead.");
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (text.length > MAX_TRANSCRIPT_CHARS) {
        setFileError(
          `That file is ${text.length.toLocaleString()} characters, over the ${MAX_TRANSCRIPT_CHARS.toLocaleString()} limit. Split it into parts.`,
        );
        return;
      }
      setTranscript(text);
      setFileName(file.name);
      // A file gives us a better default title than "Uploaded Transcript".
      if (!transcriptTitle.trim()) {
        setTranscriptTitle(
          file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim(),
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const clearTranscript = () => {
    setTranscript("");
    setFileName(null);
    setFileError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "youtube") {
      if (!url.trim()) return;
      processMutation.mutate({ youtube_url: url.trim() });
      return;
    }

    const text = transcript.trim();
    if (text.length < MIN_TRANSCRIPT_CHARS) {
      setFileError(
        `The transcript needs at least ${MIN_TRANSCRIPT_CHARS} characters — this one has ${text.length}.`,
      );
      return;
    }
    setFileError(null);
    transcriptMutation.mutate({
      transcript: text,
      title: transcriptTitle.trim() || undefined,
    });
  };

  const remainingLong = usageData?.today?.remaining_videos ?? 2;
  const remainingShort = usageData?.today?.remaining_short_videos ?? 10;
  const maxDuration = usageData?.today?.max_duration_minutes ?? 30;

  const transcriptChars = transcript.trim().length;
  const transcriptWords = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  // Shown so the user can see roughly how much material they are handing over.
  // Nothing is rationed against it - uploads are unlimited.
  const estimatedMinutes = Math.round(transcriptWords / 150);

  const canSubmit =
    mode === "youtube" ? url.trim().length > 0 : transcriptChars >= MIN_TRANSCRIPT_CHARS;

  const fieldClass =
    "w-full rounded-lg border border-line-strong bg-paper-100 px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none transition-colors focus:border-accent focus:bg-paper-50 focus:ring-2 focus:ring-accent-100 disabled:cursor-not-allowed disabled:opacity-60";

  const tabClass = (tab: Mode) =>
    cn(
      "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
      mode === tab
        ? "bg-paper-50 text-accent-700 shadow-sm ring-1 ring-inset ring-accent-200"
        : "text-ink-500 hover:text-ink-700",
    );

  return (
    <div className="space-y-5">
      <div>
        <Link
          to="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="page-title text-2xl sm:text-3xl">Make Notes</h1>
        <p className="mt-1 text-sm text-ink-500">
          {YOUTUBE_SUBMISSION_LOCKED
            ? "Bring your own transcript and let AI write the notes"
            : "Start from a YouTube link, or bring your own transcript"}
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        {/* ---- The form ------------------------------------------------- */}
        <div className="surface-card p-5 sm:p-6">
          {/* Two ways in, one pipeline: either we fetch the transcript for a
              URL, or the user hands us one directly. */}
          <div className="mb-5 flex gap-1 rounded-xl bg-paper-100 p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "youtube"}
              onClick={() => switchMode("youtube")}
              disabled={YOUTUBE_SUBMISSION_LOCKED}
              title={YOUTUBE_SUBMISSION_LOCKED ? YOUTUBE_LOCK_MESSAGE : undefined}
              className={cn(
                tabClass("youtube"),
                YOUTUBE_SUBMISSION_LOCKED && "cursor-not-allowed opacity-50",
              )}
            >
              {YOUTUBE_SUBMISSION_LOCKED ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              YouTube Link
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "transcript"}
              onClick={() => switchMode("transcript")}
              className={tabClass("transcript")}
            >
              <FileText className="h-4 w-4" />
              Upload Transcript
            </button>
          </div>

          {YOUTUBE_SUBMISSION_LOCKED && (
            <p className="mb-5 flex items-start gap-2 rounded-lg border border-line bg-paper-100 px-3.5 py-2.5 text-xs leading-relaxed text-ink-600">
              <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
              {YOUTUBE_LOCK_MESSAGE}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "youtube" ? (
              <div>
                <label
                  htmlFor="youtube-url"
                  className="mb-1.5 block text-sm font-medium text-ink-700"
                >
                  YouTube URL
                </label>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <Link2
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                      aria-hidden="true"
                    />
                    <input
                      id="youtube-url"
                      type="url"
                      placeholder="Paste your YouTube video URL here..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className={cn(fieldClass, "pl-10")}
                      disabled={processMutation.isPending}
                    />
                  </div>
                  {/* The URL is a one-field form, so its action sits beside it
                      rather than at the bottom of a form it does not have. */}
                  <button
                    type="submit"
                    disabled={!canSubmit || processMutation.isPending}
                    className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Processing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        Process Video
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink-400">
                  We fetch the transcript for you, then write the notes.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="transcript-title"
                    className="mb-1.5 block text-sm font-medium text-ink-700"
                  >
                    Topic <span className="font-normal text-ink-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <Tag
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                      aria-hidden="true"
                    />
                    <input
                      id="transcript-title"
                      type="text"
                      placeholder="e.g. Machine Learning, React, Business Strategy…"
                      value={transcriptTitle}
                      onChange={(e) => setTranscriptTitle(e.target.value)}
                      maxLength={200}
                      className={cn(fieldClass, "pl-10")}
                      disabled={transcriptMutation.isPending}
                    />
                  </div>
                  {/* An uploaded transcript carries no title of its own, so this
                      is the only thing naming the notes - and the exported PDF
                      and .md take their filename from it. It also reaches the
                      model, which writes better notes when it knows the
                      subject. */}
                  <p className="mt-2 text-xs leading-relaxed text-ink-400">
                    Names the notes and the PDF you export, and tells the AI what the
                    transcript is about. Leave it blank and the notes are filed as
                    "Uploaded Transcript".
                  </p>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "rounded-xl border border-dashed px-4 py-7 text-center transition-colors",
                    isDragging
                      ? "border-accent bg-accent-50"
                      : "border-line-strong bg-paper-100",
                  )}
                >
                  <UploadCloud className="mx-auto mb-2 h-7 w-7 text-accent-500" />
                  <p className="text-sm text-ink-600">
                    Drop a transcript file here, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-accent-600 underline underline-offset-2 hover:text-accent-800"
                    >
                      browse
                    </button>
                  </p>
                  <p className="mt-1.5 text-xs text-ink-400">
                    .txt, .md, .srt or .vtt — caption timings are stripped automatically
                  </p>
                  <p className="mt-1 text-xs text-accent-600">
                    No length limit, and uploads don't use your daily quota
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(",")}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) readFile(file);
                    }}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="transcript-text"
                      className="block text-sm font-medium text-ink-700"
                    >
                      Transcript
                    </label>
                    {transcript && (
                      <button
                        type="button"
                        onClick={clearTranscript}
                        className="inline-flex items-center gap-1 text-xs text-ink-500 transition-colors hover:text-ink-900"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <textarea
                    id="transcript-text"
                    rows={10}
                    placeholder="Paste your transcript here, or drop a file above..."
                    value={transcript}
                    onChange={(e) => {
                      setTranscript(e.target.value);
                      setFileName(null);
                      setFileError(null);
                    }}
                    className={cn(fieldClass, "resize-y font-mono leading-relaxed")}
                    disabled={transcriptMutation.isPending}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                    {fileName && (
                      <span className="inline-flex items-center gap-1 text-accent-700">
                        <FileText className="h-3 w-3" />
                        {fileName}
                      </span>
                    )}
                    <span>{transcriptWords.toLocaleString()} words</span>
                    {transcriptWords > 0 && <span>≈ {estimatedMinutes} min of speech</span>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || transcriptMutation.isPending}
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {transcriptMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                      Generate Notes
                    </>
                  )}
                </button>
              </>
            )}
          </form>

          {fileError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-600" />
              <p className="text-sm text-danger-700">{fileError}</p>
            </div>
          )}

          {activeMutation.isError && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-danger-600" />
              <div>
                <p className="text-sm font-medium text-danger-800">Error</p>
                <p className="mt-1 text-xs text-danger-600">
                  {submissionErrorMessage(
                    activeMutation.error,
                    mode === "youtube"
                      ? "Failed to process video. Please try again."
                      : "Failed to process transcript. Please try again.",
                  )}
                </p>
              </div>
            </div>
          )}

          {activeMutation.isSuccess && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-success-200 bg-success-50 p-3">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-600" />
              <div>
                <p className="text-sm font-medium text-success-700">
                  {mode === "youtube" ? "Video Submitted!" : "Transcript Submitted!"}
                </p>
                <p className="mt-1 text-xs text-success-600">
                  Your notes are being generated. You can track progress on the dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---- What this does -------------------------------------------- */}
        <aside className="surface-card overflow-hidden">
          <div className="hero-surface relative px-5 py-7">
            <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />
            <div
              className="relative flex items-center justify-center gap-2.5"
              aria-hidden="true"
            >
              {[Video, Cpu, FileText].map((Icon, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/25">
                    <Icon className="h-[18px] w-[18px] text-white" />
                  </span>
                  {index < 2 && <ArrowRight className="h-4 w-4 text-white/40" />}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-600">
              AI powered
            </p>
            <h2 className="mt-1.5 font-display text-xl font-semibold tracking-tight text-ink-900">
              From Video to Notes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {YOUTUBE_SUBMISSION_LOCKED
                ? "Hand over a transcript and get clean, structured notes back — organised, searchable and yours to keep."
                : "Quickly transform any YouTube video into clean, structured notes with the power of AI."}
            </p>

            <ul className="mt-6 space-y-4">
              {benefits.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-900">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                        {item.body}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <p className="mt-6 flex items-start gap-2.5 rounded-lg border border-accent-100 bg-accent-50 px-3.5 py-3 text-xs leading-relaxed text-ink-600">
              <Lightbulb className="mt-px h-4 w-4 shrink-0 text-accent-600" aria-hidden="true" />
              Tip: for better results, give the notes a clear topic — or leave it blank and let
              the AI work out the subject itself.
            </p>
          </div>
        </aside>
      </div>

      {/* ---- Plan limits, from the real usage endpoint --------------------- */}
      <div className="surface-card p-4">
        <h3 className="mb-3 text-sm font-medium text-ink-700">Free Plan Limits</h3>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                remainingShort > 0 ? "bg-success" : "bg-danger",
              )}
            />
            <span className="text-ink-600">
              <span className="font-medium">{remainingShort}</span> short videos remaining
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                remainingLong > 0 ? "bg-gold" : "bg-danger",
              )}
            />
            <span className="text-ink-600">
              <span className="font-medium">{remainingLong}</span> long videos remaining
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-cyan" />
            <span className="text-ink-600">
              Max <span className="font-medium">{maxDuration}</span> min per video
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-400">
          These apply to YouTube links only. Uploaded transcripts are unlimited — any length,
          any number, and they don't count against the daily allowance.
        </p>
      </div>
    </div>
  );
}
