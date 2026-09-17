import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { videosApi } from "../services/videos";

/**
 * The two ways a video enters the system, as one hook.
 *
 * Both the dashboard hero and the submit page send work to the same endpoints
 * and have to invalidate the same caches afterwards, so the mutations live here
 * rather than being written out twice and drifting.
 */
export function useVideoSubmission() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onSuccess = () => {
    // The new row and the spent quota both have to be re-read; the notes list
    // changes once processing finishes, which the dashboard handles separately.
    queryClient.invalidateQueries({ queryKey: ["videos"] });
    queryClient.invalidateQueries({ queryKey: ["usage"] });
    navigate("/dashboard");
  };

  const youtube = useMutation({
    mutationFn: videosApi.process,
    onSuccess,
  });

  const transcript = useMutation({
    mutationFn: videosApi.processTranscript,
    onSuccess,
  });

  return { youtube, transcript };
}

/**
 * Pull the API's `detail` out of an axios error, which otherwise surfaces as
 * "Request failed with status code 429" and tells the user nothing.
 */
export function submissionErrorMessage(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data
    ?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
