import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Shuffle,
  Sparkles,
} from "lucide-react";

import { useGenerateQuiz, useSubmitQuiz } from "../hooks/useQuiz";
import { useNotesForVideo } from "../hooks/useNotes";
import { useVideo } from "../hooks/useVideos";
import { QuizReview } from "../components/QuizReview";
import { QuizScore } from "../components/QuizScore";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { formatDuration, optionLabel } from "../utils/quiz";
import type { Quiz, QuizAttemptDetail, QuizDifficulty } from "../types";

const QUESTION_COUNTS = [5, 10, 15, 20];

const DIFFICULTIES: { value: QuizDifficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "Recall what the notes say" },
  { value: "medium", label: "Medium", hint: "Understand and reason" },
  { value: "hard", label: "Hard", hint: "Multi-step and edge cases" },
  { value: "mixed", label: "Mixed", hint: "A spread of all three" },
];

type Phase = "setup" | "taking" | "results";

/** Seconds since the quiz was handed over, ticking once a second. */
function useElapsed(active: boolean, startedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || startedAt == null) return;
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const id = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [active, startedAt]);

  return elapsed;
}

export function QuizPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const { data: video, isLoading: videoLoading } = useVideo(videoId || null);
  const { data: note, isLoading: noteLoading } = useNotesForVideo(
    videoId || null,
    video?.status === "completed",
  );

  const generate = useGenerateQuiz();
  const submit = useSubmitQuiz();

  const [phase, setPhase] = useState<Phase>("setup");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("mixed");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [result, setResult] = useState<QuizAttemptDetail | null>(null);
  const [reviewWrongOnly, setReviewWrongOnly] = useState(false);

  const elapsed = useElapsed(phase === "taking", startedAt);
  const questionRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Moving between phases replaces the whole page, so the reader is sent back
  // to the top of it. An effect rather than a call inside onSuccess: the new
  // phase has to be on screen before there is anything to scroll to. The app
  // shell scrolls <main> rather than the window, which is why this scrolls an
  // element into view instead of calling window.scrollTo.
  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" });
  }, [phase]);

  const answeredCount = Object.keys(answers).length;
  const total = quiz?.questions.length ?? 0;
  const question = quiz?.questions[current];
  const progress = total ? Math.round((answeredCount / total) * 100) : 0;

  const unanswered = useMemo(
    () => (quiz?.questions ?? []).filter((q) => answers[q.id] === undefined).length,
    [quiz, answers],
  );

  // A quiz in progress lives only in this component's state, so a reload or a
  // closed tab throws it away along with the AI call that produced it.
  useEffect(() => {
    if (phase !== "taking") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const startQuiz = useCallback(() => {
    if (!videoId) return;
    generate.mutate(
      { video_id: videoId, question_count: questionCount, difficulty },
      {
        onSuccess: (fresh) => {
          setQuiz(fresh);
          setAnswers({});
          setCurrent(0);
          setResult(null);
          setReviewWrongOnly(false);
          setStartedAt(Date.now());
          setPhase("taking");
        },
      },
    );
  }, [videoId, questionCount, difficulty, generate]);

  const choose = (questionId: string, index: number) => {
    setAnswers((previous) => ({ ...previous, [questionId]: index }));
  };

  const goTo = (index: number) => {
    setCurrent(index);
    // On a phone the option list can run past the fold; bring the new question
    // back to the top rather than leaving the reader mid-page.
    questionRef.current?.scrollIntoView({ block: "nearest" });
  };

  const finish = () => {
    if (!quiz) return;
    submit.mutate(
      {
        quizId: quiz.id,
        data: {
          answers: quiz.questions.map((q) => ({
            question_id: q.id,
            selected_index: answers[q.id] ?? null,
          })),
          duration_seconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined,
        },
      },
      {
        onSuccess: (attempt) => {
          setResult(attempt);
          setPhase("results");
        },
      },
    );
  };

  const retake = () => {
    setPhase("setup");
    setQuiz(null);
    setResult(null);
  };

  if (videoLoading || (noteLoading && video?.status === "completed")) {
    return <LoadingSpinner message="Loading quiz..." />;
  }

  const backLink = (
    <Link
      to={videoId ? `/notes/${videoId}` : "/notes"}
      className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Notes
    </Link>
  );

  // A quiz is built from notes, so without them there is nothing to ask about.
  if (video && video.status !== "completed") {
    return (
      <div className="mx-auto max-w-3xl p-6">
        {backLink}
        <div className="rounded-xl border border-line bg-paper-50 p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-ink-300" />
          <h3 className="mb-2 text-lg font-semibold text-ink-900">Notes are not ready yet</h3>
          <p className="text-sm text-ink-500">
            This video is still processing. The quiz unlocks as soon as its notes are generated.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------- results
  if (phase === "results" && result) {
    return (
      <div ref={topRef} className="mx-auto max-w-3xl">
        {backLink}

        <div className="rounded-2xl border border-line bg-paper-50 p-6 shadow-sm sm:p-8">
          <QuizScore
            scorePercent={result.score_percent}
            correctCount={result.correct_count}
            totalQuestions={result.total_questions}
            durationSeconds={result.duration_seconds}
            caption={result.title || undefined}
          />

          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-6">
            <button
              type="button"
              onClick={retake}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
            >
              <Shuffle className="h-4 w-4" />
              Take a new quiz
            </button>
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-accent-300 hover:text-accent-700"
            >
              <BarChart3 className="h-4 w-4" />
              Quiz dashboard
            </Link>
            <Link
              to={`/notes/${videoId}`}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-accent-300 hover:text-accent-700"
            >
              <FileText className="h-4 w-4" />
              Revise the notes
            </Link>
          </div>
        </div>

        <div className="mt-6 mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-ink-900">Answer review</h3>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={reviewWrongOnly}
              onChange={(event) => setReviewWrongOnly(event.target.checked)}
              className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
            />
            Show mistakes only
          </label>
        </div>

        <QuizReview answers={result.answers} wrongOnly={reviewWrongOnly} />
      </div>
    );
  }

  // ----------------------------------------------------------------- taking
  if (phase === "taking" && quiz && question) {
    const selected = answers[question.id];
    const isLast = current === total - 1;

    return (
      <div ref={topRef} className="mx-auto max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-semibold text-ink-900">
              {quiz.title || "Quiz"}
            </h2>
            <p className="text-xs text-ink-500">
              Question {current + 1} of {total} · {answeredCount} answered
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-50 px-3 py-1.5 text-sm font-medium text-ink-600">
            <Clock className="h-4 w-4 text-ink-400" />
            {formatDuration(elapsed)}
          </span>
        </div>

        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-paper-200">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Jump grid: filled = answered, ringed = where you are. */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {quiz.questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = index === current;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(index)}
                aria-label={`Go to question ${index + 1}`}
                aria-current={isCurrent}
                className={`h-7 w-7 rounded-md text-xs font-semibold transition-colors ${
                  isCurrent
                    ? "bg-accent text-white ring-2 ring-accent-200"
                    : isAnswered
                      ? "bg-accent-100 text-accent-700 hover:bg-accent-200"
                      : "bg-paper-200 text-ink-500 hover:bg-paper-300"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        <div
          ref={questionRef}
          className="rounded-2xl border border-line bg-paper-50 p-6 shadow-sm sm:p-8"
        >
          {question.topic && (
            <span className="mb-3 inline-block rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-medium text-accent-700">
              {question.topic}
            </span>
          )}
          <h3 className="text-lg font-medium leading-relaxed text-ink-900">{question.question}</h3>

          <div className="mt-5 space-y-2.5">
            {question.options.map((option, index) => {
              const isSelected = selected === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => choose(question.id, index)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all duration-150 ${
                    isSelected
                      ? "border-accent bg-accent-50 shadow-sm"
                      : "border-line bg-paper-50 hover:border-accent-200 hover:bg-paper-100"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected ? "bg-accent text-white" : "bg-paper-200 text-ink-600"
                    }`}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : optionLabel(index)}
                  </span>
                  <span
                    className={`min-w-0 flex-1 text-sm ${
                      isSelected ? "font-medium text-ink-900" : "text-ink-700"
                    }`}
                  >
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {submit.isError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" />
            <p className="text-sm text-danger-700">
              The quiz could not be submitted. Check your connection and try again - your answers
              are still here.
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, current - 1))}
            disabled={current === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper-50 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-accent-300 hover:text-accent-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {isLast ? (
            <div className="flex items-center gap-3">
              {unanswered > 0 && (
                <span className="text-xs text-ink-500">
                  {unanswered} unanswered
                </span>
              )}
              <button
                type="button"
                onClick={finish}
                disabled={submit.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700 disabled:opacity-60"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Submit quiz
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => goTo(Math.min(total - 1, current + 1))}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------ setup
  const generateError = generate.error as { response?: { data?: { detail?: string } } } | null;

  return (
    <div ref={topRef} className="mx-auto max-w-3xl">
      {backLink}

      <div className="rounded-2xl border border-line bg-paper-50 p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100">
            <Sparkles className="h-5 w-5 text-accent-600" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
              Quiz yourself
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {video?.title || "These notes"} — questions are written fresh from your notes each
              time, so no two attempts are the same.
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-6">
          <div>
            <label className="text-sm font-medium text-ink-800">Number of questions</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUESTION_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  aria-pressed={questionCount === count}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    questionCount === count
                      ? "border-accent bg-accent-50 text-accent-700"
                      : "border-line bg-paper-50 text-ink-600 hover:border-accent-200"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink-800">Difficulty</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {DIFFICULTIES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  aria-pressed={difficulty === option.value}
                  className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                    difficulty === option.value
                      ? "border-accent bg-accent-50"
                      : "border-line bg-paper-50 hover:border-accent-200"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${
                      difficulty === option.value ? "text-accent-700" : "text-ink-800"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {generate.isError && (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger-600" />
            <div>
              <p className="text-sm font-medium text-danger-800">Could not build the quiz</p>
              <p className="mt-1 text-xs text-danger-600">
                {generateError?.response?.data?.detail ||
                  "The AI service did not respond. Please try again in a moment."}
              </p>
            </div>
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <button
            type="button"
            onClick={startQuiz}
            disabled={generate.isPending || !note}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700 disabled:opacity-60"
          >
            {generate.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Writing your questions...
              </>
            ) : (
              <>
                {generate.isSuccess ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Start quiz
              </>
            )}
          </button>
          <Link
            to="/quiz"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-accent-700"
          >
            <BarChart3 className="h-4 w-4" />
            See past attempts
          </Link>
        </div>

        {generate.isPending && (
          <p className="mt-3 text-xs text-ink-500">
            This takes a few seconds - the questions are being written from your notes right now.
          </p>
        )}
      </div>
    </div>
  );
}
