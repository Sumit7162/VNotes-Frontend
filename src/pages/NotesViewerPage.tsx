import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useNotesForVideo } from "../hooks/useNotes";
import { useVideo } from "../hooks/useVideos";
import { NotesMarkdown } from "../components/NotesMarkdown";
import { LoadingSpinner } from "../components/LoadingSpinner";
import {
  ArrowLeft,
  FileText,
  Clock,
  Download,
  AlertCircle,
  GraduationCap,
  Loader2,
  Printer,
} from "lucide-react";
import { formatDateTime } from "../utils/datetime";
import { useQuizAttempts } from "../hooks/useQuiz";

/** Strip the characters Windows and macOS refuse in a filename, so a topic
 *  like "Ch. 3: Trees / Graphs" still downloads instead of failing silently. */
function safeFileName(title: string | null | undefined): string {
  return (title || "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

const statusLabels: Record<string, string> = {
  pending: "Queued",
  downloading: "Fetching transcript",
  extracting_audio: "Fetching transcript",
  transcribing: "Creating transcript",
  generating_notes: "Generating notes",
  completed: "Completed",
  failed: "Failed",
};


export function NotesViewerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { data: video, isLoading: videoLoading } = useVideo(videoId || null);
  const canLoadNotes = video?.status === "completed";
  const {
    data: note,
    isLoading: notesLoading,
    isError: notesError,
  } = useNotesForVideo(videoId || null, canLoadNotes);
  // Only used to label the quiz button with how many times these notes have
  // already been quizzed on; a failure here must not affect the notes.
  const { data: attempts } = useQuizAttempts(videoId || undefined);
  const attemptCount = attempts?.length ?? 0;

  // Browsers seed the "Save as PDF" filename from the document title, so while
  // these notes are on screen the tab carries their title rather than the app
  // name. That is what makes Export PDF save as "<topic>.pdf" - there is no
  // other way to name a print, since window.print() takes no filename. The
  // previous title is restored when the reader navigates away.
  const pageTitle = video?.title?.trim();
  useEffect(() => {
    if (!pageTitle) return;
    const previous = document.title;
    document.title = pageTitle;
    return () => {
      document.title = previous;
    };
  }, [pageTitle]);

  const handleDownload = () => {
    if (!note) return;
    // The exported file carries the same footer as the printed page.
    const markdown = `${note.markdown_content.trimEnd()}\n\n---\n\n_Generated ${formatDateTime(
      note.created_at,
    )}_\n`;
    const element = document.createElement("a");
    const file = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(file);
    element.href = url;
    element.download = `${safeFileName(video?.title) || "notes"}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (videoLoading) {
    return <LoadingSpinner message="Loading video..." />;
  }

  if (video && video.status !== "completed") {
    const isFailed = video.status === "failed";

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="bg-paper-50 rounded-xl border border-line p-8 text-center">
          {isFailed ? (
            <AlertCircle className="h-12 w-12 text-danger-600 mx-auto mb-4" />
          ) : (
            <Loader2 className="h-12 w-12 text-accent mx-auto mb-4 animate-spin" />
          )}
          <h3 className="text-lg font-medium text-ink-900 mb-2">
            {isFailed ? "Processing failed" : statusLabels[video.status]}
          </h3>
          <p className="text-sm text-ink-500">
            {isFailed
              ? video.error_message || "The video could not be processed."
              : "Notes will load automatically here as soon as the video finishes processing."}
          </p>
        </div>
      </div>
    );
  }

  if (notesLoading) {
    return <LoadingSpinner message="Loading notes..." />;
  }

  if (!note || notesError) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="bg-paper-50 rounded-xl border border-line p-12 text-center">
          <FileText className="h-12 w-12 text-ink-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-ink-900 mb-2">No notes found</h3>
          <p className="text-sm text-ink-500">
            Notes for this video are not available yet, or the video ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto print:p-0">
      <div className="mb-6 print:mb-4">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-4 print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="bg-paper-50 rounded-xl border border-line p-6 print:border-0 print:p-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">
                {video?.title || "Video Notes"}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDateTime(note.created_at)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 print:hidden">
              {/* The primary action on this page: turn what was just read into
                  a test of it. Filled, where the exports are quiet links. */}
              <Link
                to={`/quiz/${videoId}`}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
              >
                <GraduationCap className="h-4 w-4" />
                Give Quiz
              </Link>
              {attemptCount > 0 && (
                <Link
                  to="/quiz"
                  className="text-sm font-medium text-accent-600 hover:text-accent-800"
                >
                  {attemptCount} past {attemptCount === 1 ? "attempt" : "attempts"}
                </Link>
              )}
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900 font-medium"
              >
                <Printer className="h-4 w-4" />
                Export PDF
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900 font-medium"
              >
                <Download className="h-4 w-4" />
                Download MD
              </button>
              {/* Notes made from an uploaded transcript have nothing to link to. */}
              {video?.youtube_url && (
                <a
                  href={video.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent-600 hover:text-accent-800 font-medium"
                >
                  Watch Video
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-paper-50 rounded-xl border border-line p-8 print:border-0 print:p-0">
        <NotesMarkdown content={note.markdown_content} />

        {/* Footer - the last thing on screen and on the last printed page. */}
        <footer className="notes-footer mt-8 pt-4 border-t border-line text-xs text-ink-500 flex flex-wrap justify-between gap-2">
          <span>{video?.title || "Video Notes"}</span>
          <span>Generated {formatDateTime(note.created_at)}</span>
        </footer>
      </div>
    </div>
  );
}
