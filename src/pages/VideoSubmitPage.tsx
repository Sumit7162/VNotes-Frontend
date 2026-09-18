import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileText,
  Filter,
  Loader2,
  Lock,
  UploadCloud,
  X,
} from "lucide-react";

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

// Matches the backend's column and its own cap on how many topics a filter may
// name; past that it is a syllabus, not a filter.
const MAX_FOCUS_CHARS = 500;
const MAX_FOCUS_TOPICS = 10;

/** Split a typed topic list the way the backend does, so the count shown here
 *  is the count that will actually be sent to the model. */
function splitTopics(raw: string): string[] {
  const seen = new Set<string>();
  const topics: string[] = [];
  for (const piece of raw.split(/[,;\n]+/)) {
    const topic = piece.trim().replace(/\s+/g, " ");
    if (!topic || seen.has(topic.toLowerCase())) continue;
    seen.add(topic.toLowerCase());
    topics.push(topic);
  }
  return topics;
}

/** What the pipeline actually does, in order. Stated, not illustrated. */
const steps = [
  "The transcript is cleaned up — caption timings and numbering are stripped.",
  "A model reads it in passes, so the notes cover the whole thing rather than the opening.",
  "The notes are filed under My Notes, ready to read, export or turn into a quiz.",
];

export function VideoSubmitPage() {
  const [mode, setMode] = useState<Mode>(
    YOUTUBE_SUBMISSION_LOCKED ? "transcript" : "youtube",
  );
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [transcriptTitle, setTranscriptTitle] = useState("");
  // Shared by both sources: a topic filter narrows the notes the same way
  // whether the transcript was fetched for a link or uploaded.
  const [focusTopics, setFocusTopics] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const focus = focusTopics.trim() || undefined;

    if (mode === "youtube") {
      if (!url.trim()) return;
      processMutation.mutate({ youtube_url: url.trim(), focus_topics: focus });
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
      focus_topics: focus,
    });
  };

  const chosenTopics = splitTopics(focusTopics);
  const tooManyTopics = chosenTopics.length > MAX_FOCUS_TOPICS;

  const transcriptChars = transcript.trim().length;
  const transcriptWords = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  // Shown so the user can see roughly how much material they are handing over.
  // Nothing is rationed against it - uploads are unlimited.
  const estimatedMinutes = Math.round(transcriptWords / 150);

  const canSubmit =
    mode === "youtube" ? url.trim().length > 0 : transcriptChars >= MIN_TRANSCRIPT_CHARS;

  // Underlined tabs rather than a pill track: a rule under the current one is
  // how a printed page marks its section, and it adds no extra box.
  const tabClass = (tab: Mode) =>
    cn(
      "-mb-px border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors",
      mode === tab
        ? "border-ink-900 text-ink-900"
        : "border-transparent text-ink-500 hover:text-ink-900",
    );

  return (
    <div className="mx-auto max-w-3xl">
      {/* ---- Masthead ---------------------------------------------------- */}
      <header className="pb-7">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <p className="overline">New</p>
        <h1 className="page-title mt-2 text-[26px] leading-[1.15] sm:text-[38px]">
          Make notes
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
          {YOUTUBE_SUBMISSION_LOCKED
            ? "Bring a transcript and a model writes the notes for you."
            : "Start from a YouTube link, or bring a transcript of your own."}
        </p>
      </header>

      {/* ---- Source ------------------------------------------------------ */}
      <div className="flex gap-6 border-b border-line" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "youtube"}
          onClick={() => switchMode("youtube")}
          disabled={YOUTUBE_SUBMISSION_LOCKED}
          title={YOUTUBE_SUBMISSION_LOCKED ? YOUTUBE_LOCK_MESSAGE : undefined}
          className={cn(
            tabClass("youtube"),
            YOUTUBE_SUBMISSION_LOCKED &&
              "cursor-not-allowed text-ink-300 hover:text-ink-300",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            {YOUTUBE_SUBMISSION_LOCKED && <Lock className="h-3.5 w-3.5" />}
            YouTube link
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "transcript"}
          onClick={() => switchMode("transcript")}
          className={tabClass("transcript")}
        >
          Transcript
        </button>
      </div>

      {YOUTUBE_SUBMISSION_LOCKED && (
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-500">
          <Lock className="mt-px h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
          {YOUTUBE_LOCK_MESSAGE}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-7 space-y-6">
        {mode === "youtube" ? (
          <div>
            <label htmlFor="youtube-url" className="overline mb-2 block">
              Video URL
            </label>
            <input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="field"
              disabled={processMutation.isPending}
            />
            <p className="mt-2 text-xs text-ink-400">
              We fetch the transcript for you, then write the notes.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="transcript-title" className="overline mb-2 block">
                Topic <span className="normal-case tracking-normal text-ink-400">optional</span>
              </label>
              <input
                id="transcript-title"
                type="text"
                placeholder="Distributed consensus, lecture 4"
                value={transcriptTitle}
                onChange={(e) => setTranscriptTitle(e.target.value)}
                maxLength={200}
                className="field"
                disabled={transcriptMutation.isPending}
              />
              {/* An uploaded transcript carries no title of its own, so this is
                  the only thing naming the notes - and the exported PDF and .md
                  take their filename from it. It also reaches the model, which
                  writes better notes when it knows the subject. */}
              <p className="mt-2 text-xs leading-relaxed text-ink-400">
                Names the notes and the file you export, and tells the model what the
                transcript is about. Left blank, the notes are filed as “Uploaded
                Transcript”.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <label htmlFor="transcript-text" className="overline">
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

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "rounded-md border transition-colors",
                  isDragging ? "border-accent bg-accent-50" : "border-line-strong bg-paper-50",
                )}
              >
                <textarea
                  id="transcript-text"
                  rows={14}
                  placeholder="Paste the transcript here, or drop a file anywhere on this box…"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setFileName(null);
                    setFileError(null);
                  }}
                  className="w-full resize-y rounded-md bg-transparent px-3 py-3 font-mono text-base leading-relaxed text-ink-900 outline-none placeholder:text-ink-400 disabled:cursor-not-allowed disabled:opacity-60 sm:text-[13px]"
                  disabled={transcriptMutation.isPending}
                />

                {/* The drop target is the whole box; this strip is the visible
                    handle for it and the way in for a file picker. */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-line px-3 py-2 text-xs text-ink-400">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 font-medium text-accent-600 transition-colors hover:text-accent-700"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Choose a file
                  </button>
                  <span className="text-ink-300">|</span>
                  <span>.txt .md .srt .vtt — timings stripped</span>
                  {fileName && (
                    <span className="inline-flex items-center gap-1 text-accent-700">
                      <FileText className="h-3 w-3" />
                      {fileName}
                    </span>
                  )}
                  <span className="ml-auto tabular-nums">
                    {transcriptWords.toLocaleString()} words
                    {transcriptWords > 0 && ` · ≈ ${estimatedMinutes} min of speech`}
                  </span>
                </div>

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
            </div>
          </>
        )}

        {/* ---- Topic filter ---------------------------------------------
            Applies to both sources: name the topics and the notes cover only
            what the video says about them, instead of its whole runtime. */}
        <div className="rule pt-6">
          <label htmlFor="focus-topics" className="overline mb-2 block">
            Only these topics{" "}
            <span className="normal-case tracking-normal text-ink-400">optional</span>
          </label>
          <input
            id="focus-topics"
            type="text"
            placeholder="Backpropagation, dropout, Adam optimiser"
            value={focusTopics}
            onChange={(e) => setFocusTopics(e.target.value)}
            maxLength={MAX_FOCUS_CHARS}
            className="field"
            disabled={activeMutation.isPending}
          />
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            The notes then cover only what the video says about these topics — the
            rest of it is skipped. Separate them with commas. Leave this empty for
            notes on the whole video.
          </p>
          {chosenTopics.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-accent-600" aria-hidden="true" />
              {chosenTopics.slice(0, MAX_FOCUS_TOPICS).map((topic) => (
                <span
                  key={topic.toLowerCase()}
                  className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 ring-1 ring-inset ring-accent-100"
                >
                  {topic}
                </span>
              ))}
              {tooManyTopics && (
                <span className="text-xs text-ink-400">
                  only the first {MAX_FOCUS_TOPICS} are used
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!canSubmit || activeMutation.isPending}
            className="btn-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {activeMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {activeMutation.isPending
              ? "Sending…"
              : mode === "youtube"
                ? "Process video"
                : "Write the notes"}
          </button>
          {mode === "transcript" && !canSubmit && transcriptChars > 0 && (
            <p className="text-xs text-ink-400">
              {MIN_TRANSCRIPT_CHARS - transcriptChars} more characters needed
            </p>
          )}
        </div>
      </form>

      {fileError && (
        <p className="mt-4 flex items-start gap-2 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
          {fileError}
        </p>
      )}

      {activeMutation.isError && (
        <p className="mt-4 flex items-start gap-2 text-sm text-danger-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" />
          {submissionErrorMessage(
            activeMutation.error,
            mode === "youtube"
              ? "That video could not be processed. Try again."
              : "That transcript could not be processed. Try again.",
          )}
        </p>
      )}

      {activeMutation.isSuccess && (
        <p className="mt-4 flex items-start gap-2 text-sm text-success-700">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success-600" />
          Sent. The notes are being written — you can follow along on the dashboard.
        </p>
      )}

      {/* ---- What happens next --------------------------------------------- */}
      <section className="rule mt-12 pt-7">
        <h2 className="overline">What happens next</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink-600">
              <span className="w-4 shrink-0 tabular-nums text-ink-400">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
