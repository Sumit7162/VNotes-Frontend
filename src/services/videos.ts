import api from "./api";
import type {
  TranscriptProcessRequest,
  Video,
  VideoListResponse,
  VideoProcessRequest,
} from "../types";

export const videosApi = {
  process: async (data: VideoProcessRequest): Promise<Video> => {
    const response = await api.post("/api/videos/process", data);
    return response.data;
  },

  processTranscript: async (data: TranscriptProcessRequest): Promise<Video> => {
    const response = await api.post("/api/videos/process-transcript", data);
    return response.data;
  },

  list: async (limit = 50, offset = 0): Promise<VideoListResponse> => {
    const response = await api.get("/api/videos", {
      params: { limit, offset },
    });
    return response.data;
  },

  get: async (id: string): Promise<Video> => {
    const response = await api.get(`/api/videos/${id}`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/videos/${id}`);
  },
};
