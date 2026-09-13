import { Check, Info, Minus, X } from "lucide-react";

import { optionLabel } from "../utils/quiz";
import type { QuizAnswerReview } from "../types";

interface QuizReviewProps {
  answers: QuizAnswerReview[];
  /** Show only the questions that were answered wrong or skipped. */
  wrongOnly?: boolean;
}

/** The marked answer sheet.
 *
 *  Shared by the results screen and the review of a past attempt, so a quiz
 *  looks the same whether it was just taken or is being looked back at.
 */
export function QuizReview({ answers, wrongOnly = false }: QuizReviewProps) {
  const shown = wrongOnly ? answers.filter((answer) => !answer.is_correct) : answers;

  if (shown.length === 0) {
    return (
      <div className="rounded-xl border border-success-200 bg-success-50 p-6 text-center">
        <Check className="mx-auto mb-2 h-8 w-8 text-success-600" />
        <p className="text-sm font-medium text-success-700">
          Every question answered correctly - nothing to review.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {shown.map((answer) => {
        // Numbering follows the original paper, not the filtered view, so
        // "question 7" means the same thing in both.
        const number = answers.indexOf(answer) + 1;
        const skipped = answer.selected_index == null;

        return (
          <li
            key={answer.question_id}
            className={`rounded-xl border bg-paper-50 p-5 shadow-sm ${
              answer.is_correct ? "border-success-200" : "border-danger-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                  answer.is_correct ? "bg-success-600" : skipped ? "bg-ink-400" : "bg-danger-600"
                }`}
                aria-hidden
              >
                {answer.is_correct ? (
                  <Check className="h-3.5 w-3.5" />
                ) : skipped ? (
                  <Minus className="h-3.5 w-3.5" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Question {number}
                  </span>
                  {answer.topic && (
                    <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-medium text-accent-700">
                      {answer.topic}
                    </span>
                  )}
                  {skipped && (
                    <span className="rounded-full bg-paper-200 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                      Skipped
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-sm font-medium text-ink-900">{answer.question}</p>

                <ul className="mt-3 space-y-1.5">
                  {answer.options.map((option, index) => {
                    const isCorrect = index === answer.correct_index;
                    const isChosen = index === answer.selected_index;

                    // Three states worth showing: the right answer (always), a
                    // wrong pick (so the mistake is visible), and everything
                    // else muted.
                    const styles = isCorrect
                      ? "border-success-200 bg-success-50 text-success-700"
                      : isChosen
                        ? "border-danger-200 bg-danger-50 text-danger-700"
                        : "border-line bg-paper-100 text-ink-600";

                    return (
                      <li
                        key={index}
                        className={`flex items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${styles}`}
                      >
                        <span className="mt-px font-mono text-xs font-bold opacity-70">
                          {optionLabel(index)}
                        </span>
                        <span className="min-w-0 flex-1">{option}</span>
                        {isCorrect && (
                          <span className="shrink-0 text-[11px] font-semibold uppercase">
                            Correct
                          </span>
                        )}
                        {isChosen && !isCorrect && (
                          <span className="shrink-0 text-[11px] font-semibold uppercase">
                            Your answer
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {answer.explanation && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-paper-100 px-3 py-2.5">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                    <p className="text-xs leading-relaxed text-ink-700">{answer.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
