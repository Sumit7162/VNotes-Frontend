/** Helpers shared by the quiz pages. */

/** "4m 12s", "45s" - a quiz is minutes long, so hours never appear. */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "--";
  const whole = Math.round(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${rest}s`;
}

/** The label on an option button: A, B, C, D. */
export function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
