import { useRef, useState } from "react";
import { useUsage } from "../hooks/useUsage";
import { submissionErrorMessage, useVideoSubmission } from "../hooks/useVideoSubmission";
import {
  YOUTUBE_LOCK_MESSAGE,
  YOUTUBE_SUBMISSION_LOCKED,
} from "@/lib/features";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Link } from "react-router-dom";
import {
  Video,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  FileText,
  Upload,
  Sparkles,
  Lock,
  X,
} from "lucide-react";

type Mode = "youtube" | "transcript";

// There is no limit on how long an uploaded transcript may be. This matches
// the backend's sanity ceiling on the request body - set well past any real
// transcript - so a runaway paste is caught here rather than over the wire.
const MAX_TRANSCRIPT_CHARS = 2_000_000;
const MIN_TRANSCRIPT_CHARS = 200;
const ACCEPTED_EXTENSIONS = [".txt", ".text", ".md", ".srt", ".vtt"];

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
    reader.onerror = () => setFileError("Could not read that file. Try pasting the text instead.");
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (text.length > MAX_TRANSCRIPT_CHARS) {
        setFileError(
          `That file is ${text.length.toLocaleString()} characters, over the ${MAX_TRANSCRIPT_CHARS.toLocaleString()} limit. Split it into parts.`
        );
        return;
      }
      setTranscript(text);
      setFileName(file.name);
      // A file gives us a better default title than "Uploaded Transcript".
      if (!transcriptTitle.trim()) {
        setTranscriptTitle(file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim());
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
        `The transcript needs at least ${MIN_TRANSCRIPT_CHARS} characters — this one has ${text.length}.`
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

  const tabClass = (tab: Mode) =>
    `flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      mode === tab
        ? "bg-paper-50 text-accent-700 shadow-sm ring-1 ring-inset ring-accent-200"
        : "text-ink-500 hover:text-ink-700"
    }`;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h2 className="font-display text-2xl font-semibold text-ink-900 tracking-tight">
          Make Notes
        </h2>
        <p className="text-sm text-ink-500 mt-1">
          {YOUTUBE_SUBMISSION_LOCKED
            ? "Bring your own transcript and let AI write the notes"
            : "Start from a YouTube link, or bring your own transcript"}
        </p>
      </div>

      <div className="bg-paper-50 rounded-xl border border-line p-6">
        {/* Two ways in, one pipeline: either we fetch the transcript for a URL,
            or the user hands us one directly. */}
        {YOUTUBE_SUBMISSION_LOCKED && (
          <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-paper-100 px-3.5 py-2.5 text-xs leading-relaxed text-ink-600">
            <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
            {YOUTUBE_LOCK_MESSAGE}
          </p>
        )}

        <div className="flex gap-1 p-1 bg-paper-100 rounded-xl mb-6" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "youtube"}
            onClick={() => switchMode("youtube")}
            disabled={YOUTUBE_SUBMISSION_LOCKED}
            title={YOUTUBE_SUBMISSION_LOCKED ? YOUTUBE_LOCK_MESSAGE : undefined}
            className={`${tabClass("youtube")} ${
              YOUTUBE_SUBMISSION_LOCKED ? "cursor-not-allowed opacity-50" : ""
            }`}
          >
            {YOUTUBE_SUBMISSION_LOCKED ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Video className="h-4 w-4" />
            )}
            YouTube URL
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "youtube" ? (
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-ink-700 mb-2">
                YouTube URL
              </label>
              <input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 border border-line-strong rounded-lg text-sm focus:ring-2 focus:ring-accent-300 focus:border-accent outline-none transition-colors"
                disabled={processMutation.isPending}
              />
              <p className="text-xs text-ink-400 mt-2">
                We fetch the transcript for you, then write the notes.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label
                  htmlFor="transcript-title"
                  className="block text-sm font-medium text-ink-700 mb-2"
                >
                  Topic <span className="font-normal text-ink-400">(optional)</span>
                </label>
                <input
                  id="transcript-title"
                  type="text"
                  placeholder="Lecture 4 — Distributed Consensus"
                  value={transcriptTitle}
                  onChange={(e) => setTranscriptTitle(e.target.value)}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-line-strong rounded-lg text-sm focus:ring-2 focus:ring-accent-300 focus:border-accent outline-none transition-colors"
                  disabled={transcriptMutation.isPending}
                />
                {/* An uploaded transcript carries no title of its own, so this
                    is the only thing naming the notes - and the exported PDF
                    and .md take their filename from it. It also reaches the
                    model, which writes better notes when it knows the subject. */}
                <p className="text-xs text-ink-400 mt-2">
                  Names the notes and the PDF you export, and tells the AI what the transcript is
                  about. Leave it blank and the notes are filed as "Uploaded Transcript".
                </p>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                  isDragging ? "border-accent bg-accent-50" : "border-line-strong bg-paper-100"
                }`}
              >
                <Upload className="h-6 w-6 text-accent-500 mx-auto mb-2" />
                <p className="text-sm text-ink-600">
                  Drop a transcript file here, or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-accent-600 hover:text-accent-800 font-medium underline underline-offset-2"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  .txt, .md, .srt or .vtt — caption timings are stripped automatically
                </p>
                <p className="text-xs text-accent-600 mt-1">
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
                <div className="flex items-center justify-between mb-2">
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
                      className="inline-flex items-center gap-1 text-xs text-ink-500 hover:text-ink-700"
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
                  className="w-full px-4 py-3 border border-line-strong rounded-lg text-sm font-mono leading-relaxed focus:ring-2 focus:ring-accent-300 focus:border-accent outline-none transition-colors resize-y"
                  disabled={transcriptMutation.isPending}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400 mt-2">
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
            </>
          )}

          <button
            type="submit"
            disabled={!canSubmit || activeMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-700 disabled:bg-ink-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {activeMutation.isPending ? (
              <>
                <LoadingSpinner message="" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {mode === "youtube" ? "Process Video" : "Generate Notes"}
              </>
            )}
          </button>
        </form>

        {fileError && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-700">{fileError}</p>
          </div>
        )}

        {activeMutation.isError && (
          <div className="mt-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-danger-800">Error</p>
              <p className="text-xs text-danger-600 mt-1">
                {submissionErrorMessage(
                  activeMutation.error,
                  mode === "youtube"
                    ? "Failed to process video. Please try again."
                    : "Failed to process transcript. Please try again."
                )}
              </p>
            </div>
          </div>
        )}

        {activeMutation.isSuccess && (
          <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-success-700">
                {mode === "youtube" ? "Video Submitted!" : "Transcript Submitted!"}
              </p>
              <p className="text-xs text-success-600 mt-1">
                Your notes are being generated. You can track progress on the dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-paper-100 rounded-xl p-4">
        <h3 className="text-sm font-medium text-ink-700 mb-3">Free Plan Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${remainingShort > 0 ? "bg-success-500" : "bg-danger-500"}`} />
            <span className="text-ink-600">
              <span className="font-medium">{remainingShort}</span> short videos remaining
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${remainingLong > 0 ? "bg-gold" : "bg-danger-500"}`} />
            <span className="text-ink-600">
              <span className="font-medium">{remainingLong}</span> long videos remaining
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-ink-600">
              Max <span className="font-medium">{maxDuration}</span> min per video
            </span>
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-3">
          These apply to YouTube links only. Uploaded transcripts are unlimited — any length, any
          number, and they don't count against the daily allowance.
        </p>
      </div>
    </div>
  );
}
