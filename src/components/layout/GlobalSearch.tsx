import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { videosApi } from "../../services/videos";
import { formatDateTime } from "../../utils/datetime";
import type { VideoListResponse } from "../../types";

const MAX_RESULTS = 6;

/** "⌘ K" on a Mac, "Ctrl K" everywhere else. Read once - it cannot change. */
const shortcutHint =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘ K"
    : "Ctrl K";

/**
 * Search across the videos this account has actually processed.
 *
 * The list is fetched only once the field is opened, and with its own query key
 * so it neither piggybacks on nor disturbs the dashboard's polling copy.
 * Matching happens here rather than over the wire because there is no search
 * endpoint - and inventing one would mean changing the API, which this redesign
 * does not do.
 */
export function GlobalSearch() {
  const [term, setTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery<VideoListResponse>({
    queryKey: ["videos", "search"],
    queryFn: () => videosApi.list(50, 0),
    enabled: isOpen,
    staleTime: 30_000,
  });

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    return (data?.videos ?? [])
      .filter((video) => (video.title ?? "").toLowerCase().includes(needle))
      .slice(0, MAX_RESULTS);
  }, [data, term]);

  // The shortcut is advertised in the field, so it has to actually work.
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setIsOpen(true);
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const go = (videoId: string, hasNotes: boolean) => {
    setIsOpen(false);
    setTerm("");
    // Only a finished video has notes to open; anything else is still on the
    // dashboard, where its progress is shown.
    navigate(hasNotes ? `/notes/${videoId}` : "/dashboard");
  };

  const showPanel = isOpen && term.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search your videos, notes, or topics..."
          aria-label="Search your videos and notes"
          className="h-9 w-full rounded-lg border border-line bg-paper-100 pl-9 pr-16 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-accent-300 focus:bg-paper-50 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        {term ? (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition-colors hover:text-ink-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-paper-200 px-1.5 py-0.5 font-sans text-[10px] font-medium text-ink-400 md:block">
            {shortcutHint}
          </kbd>
        )}
      </div>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-paper-50 shadow-lg">
          {isLoading ? (
            <p className="flex items-center gap-2 px-4 py-3 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching your library…
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-500">
              Nothing matches “<span className="text-ink-700">{term.trim()}</span>”.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.map((video) => {
                const hasNotes = video.status === "completed";
                return (
                  <li key={video.id}>
                    <button
                      type="button"
                      onClick={() => go(video.id, hasNotes)}
                      className="flex w-full items-start gap-3 px-3 py-2 text-left transition-colors hover:bg-paper-200"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                          hasNotes
                            ? "bg-accent-50 text-accent-600"
                            : "bg-paper-200 text-ink-400",
                        )}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink-900">
                          {video.title || "Untitled video"}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          {hasNotes ? "Notes ready" : "Still processing"} ·{" "}
                          {formatDateTime(video.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
