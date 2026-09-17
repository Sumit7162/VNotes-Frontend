/**
 * Temporary feature switches.
 *
 * These exist so a capability can be taken out of the interface in one place
 * rather than by deleting the code that implements it. The backend is
 * untouched: every endpoint behind a locked switch still works, it is simply
 * not reachable from the UI until the switch is flipped back.
 */

/**
 * Submitting a YouTube URL is turned off for now; notes are generated from a
 * transcript the user supplies instead.
 *
 * Set this back to `false` to restore it - nothing else has to change. The
 * `/api/videos/process` endpoint, its mutation and the submit page's YouTube
 * form are all still in place behind it.
 */
export const YOUTUBE_SUBMISSION_LOCKED = true;

/** Shown wherever the lock is surfaced, so the wording stays consistent. */
export const YOUTUBE_LOCK_MESSAGE =
  "YouTube links are paused for now. Upload or paste a transcript instead — the notes come out the same.";

/** The short form, for tight spaces like an input's placeholder. */
export const YOUTUBE_LOCK_SHORT = "YouTube links are temporarily unavailable";
