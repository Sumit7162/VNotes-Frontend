import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";

import { useQuizDashboard } from "../hooks/useQuiz";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { scoreTone } from "../components/QuizScore";
import { formatDateTime } from "../utils/datetime";
import { formatDuration } from "../utils/quiz";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper-50 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-100">
          <Icon className="h-4 w-4 text-accent-600" />
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/** A compact score pill, tinted by how well the attempt went. */
function ScorePill({ percent }: { percent: number }) {
  const tone = scoreTone(percent);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.chip}`}
    >
      {percent}%
    </span>
  );
}

export function QuizDashboardPage() {
  const { data, isLoading } = useQuizDashboard();

  if (isLoading) {
    return <LoadingSpinner message="Loading quiz history..." />;
  }

  const hasAttempts = !!data && data.total_attempts > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900">
            Quiz Dashboard
          </h2>
          <p className="mt-1.5 text-sm text-ink-500">
            Every quiz you have taken, and how you did
          </p>
        </div>
        <Link
          to="/notes"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
        >
          <BookOpen className="h-4 w-4" />
          Pick notes to quiz
        </Link>
      </div>

      {!hasAttempts ? (
        <div className="rounded-2xl border border-line bg-paper-50 p-12 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-4 h-12 w-12 text-ink-300" />
          <h3 className="mb-2 text-lg font-semibold text-ink-900">No quizzes yet</h3>
          <p className="mx-auto mb-4 max-w-md text-sm text-ink-500">
            Open any set of notes and press <strong className="text-ink-700">Give Quiz</strong> to
            test yourself. Your score and every answer you gave will be kept here.
          </p>
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
          >
            Go to My Notes
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ClipboardList}
              label="Attempts"
              value={String(data.total_attempts)}
              hint={`across ${data.videos_quizzed} ${data.videos_quizzed === 1 ? "topic" : "topics"}`}
            />
            <StatCard
              icon={TrendingUp}
              label="Average"
              value={`${data.average_score}%`}
              hint="across all attempts"
            />
            <StatCard icon={Award} label="Best score" value={`${data.best_score}%`} />
            <StatCard
              icon={Target}
              label="Correct"
              value={`${data.total_correct}/${data.total_questions_answered}`}
              hint="questions answered right"
            />
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-ink-900">Recent attempts</h3>
            <div className="space-y-2.5">
              {data.recent_attempts.map((attempt) => (
                <Link
                  key={attempt.id}
                  to={`/quiz/attempt/${attempt.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-line bg-paper-50 p-4 shadow-sm transition-all duration-200 hover:border-accent-200 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-100">
                    <BarChart3 className="h-5 w-5 text-accent-600" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-ink-900">
                      {attempt.title || "Quiz"}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
                      <span>
                        {attempt.correct_count}/{attempt.total_questions} correct
                      </span>
                      <span>{formatDateTime(attempt.created_at)}</span>
                      {attempt.duration_seconds != null && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(attempt.duration_seconds)}
                        </span>
                      )}
                    </div>
                  </div>

                  <ScorePill percent={attempt.score_percent} />
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-semibold text-ink-900">By topic</h3>
            <div className="overflow-hidden rounded-2xl border border-line bg-paper-50 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-500">
                      <th className="px-4 py-3 font-medium">Notes</th>
                      <th className="px-4 py-3 font-medium">Attempts</th>
                      <th className="px-4 py-3 font-medium">Average</th>
                      <th className="px-4 py-3 font-medium">Best</th>
                      <th className="px-4 py-3 font-medium">Last taken</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_video.map((row) => (
                      <tr
                        key={row.video_id}
                        className="border-b border-line last:border-0 hover:bg-paper-100"
                      >
                        <td className="max-w-[16rem] truncate px-4 py-3 font-medium text-ink-800">
                          {row.title || "Untitled notes"}
                        </td>
                        <td className="px-4 py-3 text-ink-600">{row.attempts}</td>
                        <td className="px-4 py-3">
                          <ScorePill percent={row.average_score} />
                        </td>
                        <td className="px-4 py-3 text-ink-600">{row.best_score}%</td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-500">
                          {formatDateTime(row.last_attempt_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/quiz/${row.video_id}`}
                            className="whitespace-nowrap text-xs font-semibold text-accent-600 hover:text-accent-800"
                          >
                            Retake
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
