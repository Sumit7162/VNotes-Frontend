export interface User {
  id: string;
  google_id: string;
  email: string;
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
