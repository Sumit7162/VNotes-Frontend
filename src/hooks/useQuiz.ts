import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { quizApi } from "../services/quiz";
import type {
  Quiz,
  QuizAttemptDetail,
  QuizAttemptSummary,
  QuizDashboardData,
  QuizGenerateRequest,
  QuizSubmitRequest,
} from "../types";

/** Generate a fresh quiz.
 *
 *  A mutation rather than a query on purpose: generating is a side effect that
 *  costs an AI call and must happen exactly when the learner asks for it. As a
 *  cached query, React Query would replay the same quiz on every remount -
 *  the opposite of what this feature is for.
 */
export function useGenerateQuiz() {
  return useMutation<Quiz, unknown, QuizGenerateRequest>({
    mutationFn: quizApi.generate,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation<QuizAttemptDetail, unknown, { quizId: string; data: QuizSubmitRequest }>({
    mutationFn: ({ quizId, data }) => quizApi.submit(quizId, data),
    onSuccess: () => {
      // The new attempt has to show up on the dashboard behind this page.
      queryClient.invalidateQueries({ queryKey: ["quiz-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
    },
  });
}

export function useQuizDashboard() {
  return useQuery<QuizDashboardData>({
    queryKey: ["quiz-dashboard"],
    queryFn: quizApi.dashboard,
  });
}

export function useQuizAttempts(videoId?: string) {
  return useQuery<QuizAttemptSummary[]>({
    queryKey: ["quiz-attempts", videoId ?? "all"],
    queryFn: () => quizApi.listAttempts(videoId),
  });
}

export function useQuizAttempt(attemptId: string | null) {
  return useQuery<QuizAttemptDetail>({
    queryKey: ["quiz-attempt", attemptId],
    queryFn: () => quizApi.getAttempt(attemptId!),
    enabled: !!attemptId,
  });
}

export function useDeleteAttempt() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: quizApi.deleteAttempt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
    },
  });
}
