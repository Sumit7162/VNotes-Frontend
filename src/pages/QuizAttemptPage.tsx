import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, FileText, Shuffle, Trash2 } from "lucide-react";

import { useDeleteAttempt, useQuizAttempt } from "../hooks/useQuiz";
import { QuizReview } from "../components/QuizReview";
import { QuizScore } from "../components/QuizScore";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { formatDateTime } from "../utils/datetime";

/** One past attempt, question by question - what was asked, what was chosen,
 *  and what the right answer was. */
export function QuizAttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { data: attempt, isLoading, isError } = useQuizAttempt(attemptId || null);
  const deleteAttempt = useDeleteAttempt();
  const [wrongOnly, setWrongOnly] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="Loading attempt..." />;
  }

  const backLink = (
    <Link
      to="/quiz"
      className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Quiz Dashboard
    </Link>
  );

  if (isError || !attempt) {
    return (
      <div className="mx-auto max-w-3xl">
        {backLink}
        <div className="rounded-xl border border-line bg-paper-50 p-8 text-center sm:p-12">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-ink-300" />
          <h3 className="mb-2 text-lg font-semibold text-ink-900">Attempt not found</h3>
          <p className="text-sm text-ink-500">
            This attempt may have been deleted, or it belongs to another account.
          </p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    deleteAttempt.mutate(attempt.id, { onSuccess: () => navigate("/quiz") });
  };

  return (
    <div className="mx-auto max-w-3xl">
      {backLink}

      <div className="rounded-2xl border border-line bg-paper-50 p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="break-words font-display text-lg font-semibold text-ink-900 sm:text-xl">
            {attempt.title || "Quiz attempt"}
          </h2>
          <p className="mt-1 text-sm text-ink-500">Taken {formatDateTime(attempt.created_at)}</p>
        </div>

        <QuizScore
          scorePercent={attempt.score_percent}
          correctCount={attempt.correct_count}
          totalQuestions={attempt.total_questions}
          durationSeconds={attempt.duration_seconds}
        />

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <Link
            to={`/quiz/${attempt.video_id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
          >
            <Shuffle className="h-4 w-4" />
            Retake with new questions
          </Link>
          <Link
            to={`/notes/${attempt.video_id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-accent-300 hover:text-accent-700"
          >
            <FileText className="h-4 w-4" />
            Open the notes
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteAttempt.isPending}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 sm:ml-auto ${
              confirmingDelete
                ? "bg-danger-600 text-white hover:bg-danger-700"
                : "text-ink-500 hover:text-danger-600"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmingDelete ? "Confirm delete" : "Delete"}
          </button>
        </div>
      </div>

      <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-semibold text-ink-900">Answer review</h3>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            checked={wrongOnly}
            onChange={(event) => setWrongOnly(event.target.checked)}
            className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
          />
          Show mistakes only
        </label>
      </div>

      <QuizReview answers={attempt.answers} wrongOnly={wrongOnly} />
    </div>
  );
}
