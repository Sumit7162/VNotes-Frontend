export interface User {
  id: string;
  /** Null for an account that signs in with an email address and a password. */
  google_id: string | null;
  email: string;
  /** False until the verification link has been followed. */
  email_verified: boolean;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  created_at: string;
  updated_at: string;
}

export type VideoStatus =
  | "pending"
  | "transcribing"
  | "generating_notes"
  | "completed"
  | "failed"
  // Retired stages, kept so videos processed before transcripts moved to the
  // transcript API still render.
  | "downloading"
  | "extracting_audio";

// Where a record's transcript came from: a URL we fetched it for, or a
// transcript the user uploaded or pasted themselves.
export type VideoSource = "youtube" | "transcript";

export interface Video {
  id: string;
  /** Null for uploaded transcripts, which have no source URL. */
  youtube_url: string | null;
  source: VideoSource;
  title: string | null;
  duration_seconds: number | null;
  status: VideoStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoListResponse {
  videos: Video[];
  total: number;
}

export interface Note {
  id: string;
  video_id: string;
  markdown_content: string;
  model_used: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  date: string;
  videos_processed: number;
  short_videos_processed: number;
  minutes_processed: number;
  daily_limit: number;
  daily_short_limit: number;
  remaining_videos: number;
  remaining_short_videos: number;
  max_duration_minutes: number;
  remaining_minutes: number;
  total_videos: number;
}

export interface UsageData {
  date: string;
  videos_processed: number;
  short_videos_processed: number;
  minutes_processed: number;
  daily_limit: number;
  daily_short_limit: number;
  remaining_videos: number;
  remaining_short_videos: number;
  max_duration_minutes: number;
  remaining_minutes: number;
}

export interface UsageSummary {
  total_videos: number;
  today: UsageData;
}

export interface VideoProcessRequest {
  youtube_url: string;
}

export interface TranscriptProcessRequest {
  /** Raw transcript text; .srt/.vtt scaffolding is stripped server-side. */
  transcript: string;
  title?: string;
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export type QuizDifficulty = "easy" | "medium" | "hard" | "mixed";

/** A question as the person taking the quiz sees it: no answer key. The
 *  correct option is only revealed by the grading response. */
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  topic: string | null;
}

export interface Quiz {
  id: string;
  video_id: string;
  note_id: string;
  title: string | null;
  difficulty: QuizDifficulty;
  question_count: number;
  model_used: string | null;
  created_at: string;
  questions: QuizQuestion[];
}

export interface QuizGenerateRequest {
  video_id: string;
  question_count?: number;
  difficulty?: QuizDifficulty;
}

export interface QuizAnswerSubmit {
  question_id: string;
  /** Null for a question that was left unanswered. */
  selected_index: number | null;
}

export interface QuizSubmitRequest {
  answers: QuizAnswerSubmit[];
  duration_seconds?: number;
}

/** One graded question, returned after submitting and when reviewing. */
export interface QuizAnswerReview {
  question_id: string;
  question: string;
  options: string[];
  selected_index: number | null;
  correct_index: number;
  is_correct: boolean;
  explanation: string | null;
  topic: string | null;
}

export interface QuizAttemptSummary {
  id: string;
  quiz_id: string;
  video_id: string;
  title: string | null;
  total_questions: number;
  correct_count: number;
  score_percent: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface QuizAttemptDetail extends QuizAttemptSummary {
  answers: QuizAnswerReview[];
}

export interface QuizVideoStat {
  video_id: string;
  title: string | null;
  attempts: number;
  best_score: number;
  average_score: number;
  last_attempt_at: string;
}

export interface QuizDashboardData {
  total_attempts: number;
  total_questions_answered: number;
  total_correct: number;
  average_score: number;
  best_score: number;
  videos_quizzed: number;
  recent_attempts: QuizAttemptSummary[];
  by_video: QuizVideoStat[];
}
