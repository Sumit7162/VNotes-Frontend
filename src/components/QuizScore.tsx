import { Award, CheckCircle2, Clock, XCircle } from "lucide-react";

import { formatDuration } from "../utils/quiz";

interface QuizScoreProps {
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  durationSeconds?: number | null;
  /** A short line under the ring, e.g. when the attempt was taken. */
  caption?: string;
}

/** How a score reads at a glance. Green for a pass, amber in the middle, red
 *  below half - the one place in this blue app where hue carries meaning. */
export function scoreTone(percent: number) {
  if (percent >= 80) {
    return {
      text: "text-success-700",
      ring: "#1F7A4C",
      track: "bg-success-100",
      chip: "bg-success-50 text-success-700 border-success-200",
      label: "Excellent",
    };
  }
  if (percent >= 50) {
    return {
      text: "text-gold-700",
      ring: "#A9700B",
      track: "bg-gold-100",
      chip: "bg-gold-50 text-gold-700 border-gold-200",
      label: "Keep going",
    };
  }
  return {
    text: "text-danger-700",
    ring: "#C0362F",
    track: "bg-danger-100",
    chip: "bg-danger-50 text-danger-700 border-danger-200",
    label: "Needs review",
  };
}

export function QuizScore({
  scorePercent,
  correctCount,
  totalQuestions,
  durationSeconds,
  caption,
}: QuizScoreProps) {
  const tone = scoreTone(scorePercent);
  const incorrect = Math.max(0, totalQuestions - correctCount);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      {/* A conic gradient is the cheapest honest progress ring: no SVG maths,
          and it reads correctly at any size. */}
      <div
        className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
        style={{
          background: `conic-gradient(${tone.ring} ${scorePercent * 3.6}deg, rgb(var(--paper-200)) 0deg)`,
        }}
        role="img"
        aria-label={`Score ${scorePercent} percent`}
      >
        <div className="grid h-[6.5rem] w-[6.5rem] place-items-center rounded-full bg-paper-50">
          <span className={`font-display text-3xl font-semibold ${tone.text}`}>
            {scorePercent}%
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tone.chip}`}
          >
            <Award className="h-3.5 w-3.5" />
            {tone.label}
          </span>
          {caption && <span className="text-xs text-ink-500">{caption}</span>}
        </div>

        <p className="mt-3 font-display text-2xl font-semibold text-ink-900">
          {correctCount} of {totalQuestions} correct
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-ink-600 sm:justify-start">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-success-600" />
            {correctCount} right
          </span>
          <span className="inline-flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-danger-600" />
            {incorrect} wrong
          </span>
          {durationSeconds != null && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-ink-400" />
              {formatDuration(durationSeconds)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
