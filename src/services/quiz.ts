import api from "./api";
import type {
  Quiz,
  QuizAttemptDetail,
  QuizAttemptSummary,
  QuizDashboardData,
  QuizGenerateRequest,
  QuizSubmitRequest,
} from "../types";

export const quizApi = {
  /** Generate a brand new quiz. Nothing is cached or reused server-side, so
   *  every call returns different questions in a different option order. */
  generate: async (request: QuizGenerateRequest): Promise<Quiz> => {
    const response = await api.post("/api/quizzes/generate", request);
    return response.data;
  },

  get: async (quizId: string): Promise<Quiz> => {
    const response = await api.get(`/api/quizzes/${quizId}`);
    return response.data;
  },

  submit: async (quizId: string, request: QuizSubmitRequest): Promise<QuizAttemptDetail> => {
    const response = await api.post(`/api/quizzes/${quizId}/submit`, request);
    return response.data;
  },

  dashboard: async (): Promise<QuizDashboardData> => {
    const response = await api.get("/api/quizzes/dashboard");
    return response.data;
  },

  listAttempts: async (videoId?: string): Promise<QuizAttemptSummary[]> => {
    const response = await api.get("/api/quizzes/attempts", {
      params: videoId ? { video_id: videoId } : undefined,
    });
    return response.data;
  },

  getAttempt: async (attemptId: string): Promise<QuizAttemptDetail> => {
    const response = await api.get(`/api/quizzes/attempts/${attemptId}`);
    return response.data;
  },

  deleteAttempt: async (attemptId: string): Promise<void> => {
    await api.delete(`/api/quizzes/attempts/${attemptId}`);
  },
};
