import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, GraduationCap, Loader2, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { videosApi } from "../services/videos";
import { formatDateTime } from "../utils/datetime";
import type { Video } from "../types";

/**
 * One line of the library.
 *
 * Deliberately a row in a ruled list rather than a card: ten cards read as ten
 * separate objects competing for attention, while ten rules read as one index
 * you can scan down. The actions stay quiet until the row is hovered or
 * focused, so the column of titles is what the eye follows.
 */

const statusLabels: Record<string, string> = {
  pending: "Queued",
  downloading: "Fetching transcript",
  extracting_audio: "Fetching transcript",
  transcribing: "Transcribing",
  generating_notes: "Writing notes",
  completed: "Ready",
  failed: "Failed",
};

/** The video id out of any of the URL shapes YouTube hands out. */
function youtubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds} sec`;
}

export function VideoRow({ video }: { video: Video }) {
  const [confirming, setConfirming] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => videosApi.delete(video.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const isDone = video.status === "completed";
  const isFailed = video.status === "failed";
  const isRunning = !isDone && !isFailed;
  const thumbnail = youtubeThumbnail(video.youtube_url);
  const duration = formatDuration(video.duration_seconds);

  const meta = [
    duration,
    formatDateTime(video.created_at),
    video.source === "transcript" ? "Transcript" : null,
  ].filter(Boolean);

  return (
    <article className="record-row group hover:bg-paper-200/50">
      {thumbnail ? (
        <div className="hidden h-12 w-[84px] shrink-0 overflow-hidden rounded border border-line bg-paper-200 sm:block">
          <img
            src={thumbnail}
            alt=""
            loading="lazy"
            // A private or removed video serves a placeholder rather than a
            // 404, so the tile is hidden on error and the row closes up.
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="hidden h-12 w-[84px] shrink-0 items-center justify-center rounded border border-line bg-paper-200 sm:flex">
          <FileText className="h-4 w-4 text-ink-400" aria-hidden="true" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-[15px] font-semibold tracking-[-0.01em] text-ink-900">
          {isDone ? (
            <Link to={`/notes/${video.id}`} className="hover:underline underline-offset-4">
              {video.title || "Untitled"}
            </Link>
          ) : (
            (video.title ?? "Untitled")
          )}
        </h3>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              isFailed && "text-danger-600",
              isRunning && "text-accent-600",
            )}
          >
            {isRunning && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
            {statusLabels[video.status] ?? video.status}
          </span>
          {meta.map((item) => (
            <span key={item as string} className="before:mr-2 before:content-['·']">
              {item}
            </span>
          ))}
        </p>

        {isFailed && video.error_message && (
          <p className="mt-1.5 text-xs leading-relaxed text-danger-600">
            {video.error_message}
          </p>
        )}
      </div>

      {/* Held at full opacity on touch, where there is no hover to reveal them. */}
      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        {isDone && (
          <>
            <Link
              to={`/notes/${video.id}`}
              className="rounded p-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
              title="Open notes"
              aria-label={`Open notes for ${video.title || "this video"}`}
            >
              <FileText className="h-4 w-4" />
            </Link>
            <Link
              to={`/quiz/${video.id}`}
              className="rounded p-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
              title="Take the quiz"
              aria-label={`Quiz for ${video.title || "this video"}`}
            >
              <GraduationCap className="h-4 w-4" />
            </Link>
          </>
        )}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={deleteMutation.isPending}
          className="rounded p-2 text-ink-500 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
          title="Delete"
          aria-label={`Delete ${video.title || "this video"}`}
        >
          {deleteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night-900/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-lg border border-line bg-paper-50 p-5">
            <h4 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink-900">
              Delete these notes?
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              “{video.title || "Untitled"}” and the notes made from it will be removed. This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-md border border-line px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-paper-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMutation.mutate();
                  setConfirming(false);
                }}
                className="rounded-md bg-danger px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
