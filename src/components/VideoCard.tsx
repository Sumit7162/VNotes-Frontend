import { useState } from "react";
import {
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Loader2,
  Trash2,
  FileText,
} from "lucide-react";
import type { Video as VideoType } from "../types";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { videosApi } from "../services/videos";
import type { ReactNode } from "react";
import { formatDateTime } from "../utils/datetime";

// Each stage of the pipeline gets its own hue, so a glance at a list of cards
// tells you what is happening without reading any of the labels. `tone` styles
// the badge, `bar` the progress track beneath it, so the two always agree.
const statusConfig: Record<string, { icon: ReactNode; tone: string; bar: string; label: string }> = {
  pending: {
    icon: <Clock className="h-3.5 w-3.5" />,
    tone: "bg-paper-200 text-ink-600 ring-line",
    bar: "bg-ink-400",
    label: "Pending",
  },
  downloading: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    tone: "bg-gold-50 text-gold-700 ring-gold-200",
    bar: "bg-gold",
    label: "Downloading",
  },
  extracting_audio: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    tone: "bg-gold-50 text-gold-700 ring-gold-200",
    bar: "bg-gold",
    label: "Extracting Audio",
  },
  transcribing: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    tone: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    bar: "bg-cyan",
    label: "Transcribing",
  },
  generating_notes: {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    tone: "bg-violet-50 text-violet-700 ring-violet-200",
    bar: "bg-violet",
    label: "Generating Notes",
  },
  completed: {
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    tone: "bg-success-50 text-success-700 ring-success-100",
    bar: "bg-success",
    label: "Completed",
  },
  failed: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    tone: "bg-danger-50 text-danger-700 ring-danger-200",
    bar: "bg-danger",
    label: "Failed",
  },
};

const processingSteps = [
  { status: "pending", label: "Queued" },
  { status: "transcribing", label: "Transcript" },
  { status: "generating_notes", label: "Notes" },
  { status: "completed", label: "Done" },
];

// An uploaded transcript never passes through a fetch stage - the text is
// already here - so its progress bar drops that step rather than showing one
// that can never light up.
const transcriptSteps = processingSteps.filter((step) => step.status !== "transcribing");

// "10:00" next to a "9:27 AM" timestamp reads as a second clock time, so a
// duration is always spelled out with its units.
function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours} hr ${minutes} min`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds} sec`;
}

interface VideoCardProps {
  video: VideoType;
}

export function VideoCard({ video }: VideoCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => videosApi.delete(video.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const status = statusConfig[video.status] || statusConfig.pending;
  const isUpload = video.source === "transcript";
  const steps = isUpload ? transcriptSteps : processingSteps;
  const currentStep = Math.max(
    0,
    steps.findIndex((step) => step.status === video.status)
  );
  const isActive = video.status !== "completed" && video.status !== "failed";
  const progress = Math.round((currentStep / (steps.length - 1)) * 100);

  return (
    <>
      <div className="bg-paper-50 rounded-2xl border border-line p-4 shadow-sm hover:shadow-md hover:border-accent-200 transition-all duration-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 bg-accent-50 ring-1 ring-inset ring-accent-100 rounded-xl flex items-center justify-center">
              {isUpload ? (
                <FileText className="h-5 w-5 text-accent-600" />
              ) : (
                <Video className="h-5 w-5 text-accent-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-ink-900 truncate">
                {video.title || "Processing..."}
              </h3>
              <p className="text-xs text-ink-500 truncate mt-0.5">
                {video.youtube_url || "Uploaded transcript"}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${status.tone}`}
                >
                  {status.icon}
                  {status.label}
                </span>
                {formatDuration(video.duration_seconds) && (
                  <span className="text-xs text-ink-400">
                    {formatDuration(video.duration_seconds)}
                  </span>
                )}
                <span className="text-xs text-ink-400">
                  {formatDateTime(video.created_at)}
                </span>
              </div>
              {video.status === "failed" && video.error_message && (
                <p className="text-xs text-danger-600 mt-2 bg-danger-50 rounded-lg px-2 py-1">
                  {video.error_message}
                </p>
              )}
              {isActive && (
                <div className="mt-4">
                  <div className="h-1.5 overflow-hidden rounded-full bg-paper-200">
                    <div
                      className={`h-full rounded-full ${status.bar} transition-all duration-500`}
                      style={{ width: `${Math.max(progress, 8)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] font-medium text-ink-400">
                    {steps.map((step, index) => {
                      const isCurrent = index === currentStep;
                      const isDone = index < currentStep;

                      let alignmentClass = "text-center flex-1";
                      if (index === 0) alignmentClass = "text-left flex-1";
                      else if (index === steps.length - 1) alignmentClass = "text-right flex-1";

                      return (
                        <span
                          key={step.status}
                          className={`${alignmentClass} ${
                            isCurrent
                              ? "text-accent-700"
                              : isDone
                                ? "text-ink-600"
                                : ""
                          }`}
                        >
                          {step.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Wraps rather than overflows: three controls is the most this row
              ever holds, and on a narrow phone they need the second line. */}
          <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-2 self-end sm:self-start">
            {/* Both actions need finished notes: one to read them, one to be
                tested on them. */}
            {video.status === "completed" && (
              <>
                <Link
                  to={`/notes/${video.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-700 hover:text-accent-800 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Notes
                </Link>
                <Link
                  to={`/quiz/${video.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-700 hover:text-accent-800 bg-accent-50 hover:bg-accent-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Quiz
                </Link>
              </>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg text-ink-400 hover:text-danger-600 hover:bg-danger-50 transition-colors disabled:opacity-50"
              title="Delete video"
              id={`delete-video-${video.id}`}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-ink-900/45"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-paper-50 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-ink-900">
                  Delete Video
                </h3>
                <p className="text-xs text-ink-500">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm text-ink-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-ink-900">
                {video.title || "this video"}
              </span>
              ? All associated notes and files will be permanently removed.
            </p>
            {deleteMutation.isError && (
              <p className="text-xs text-danger-600 mb-4 bg-danger-50 rounded px-3 py-2">
                Failed to delete. Please try again.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-ink-700 bg-paper-200 hover:bg-paper-300 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate(undefined, {
                    onSuccess: () => setShowConfirm(false),
                  });
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                id="confirm-delete-video"
              >
                {deleteMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
