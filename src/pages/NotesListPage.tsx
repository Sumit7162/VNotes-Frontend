import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Plus,
  Search,
  X,
} from "lucide-react";

import { useNotes } from "../hooks/useNotes";
import { useVideos } from "../hooks/useVideos";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ViewToggle, type NotesView } from "../components/ViewToggle";
import { formatDateTime } from "../utils/datetime";
import { cn } from "@/lib/utils";
import type { Note, Video } from "../types";

const VIEW_STORAGE_KEY = "notes-view";
const PAGE_SIZE = 9;

type SortKey = "latest" | "oldest" | "title";

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "title", label: "Title A–Z" },
];

function loadView(): NotesView {
  try {
    return localStorage.getItem(VIEW_STORAGE_KEY) === "grid" ? "grid" : "list";
  } catch {
    return "list";
  }
}

/** The note's own H1, which is what the generator writes at the top. */
function headingTitle(note: Note): string | null {
  const heading = note.markdown_content.split("\n").find((line) => line.startsWith("# "));
  return heading?.replace(/^#+ /, "").trim() || null;
}

/**
 * The opening prose, with the markup taken out.
 *
 * Headings, list bullets, emphasis and code fences are all stripped so the
 * summary reads as a sentence rather than as the source it came from.
 */
function summarise(markdown: string): string {
  const body = markdown
    .split("\n")
    .filter((line) => !line.startsWith("#") && !line.startsWith("```"))
    .join(" ")
    .replace(/[*_`>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return body.slice(0, 200);
}

/** The video id out of any of the URL shapes YouTube hands out. */
function youtubeThumbnail(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

/** A note joined to the video it was made from. */
interface Entry {
  note: Note;
  video?: Video;
  title: string;
  summary: string;
  thumbnail: string | null;
  duration: string | null;
}

export function NotesListPage() {
  const { data: notes, isLoading } = useNotes();
  // The notes endpoint returns the markdown but not the title, runtime or
  // source URL, so those are read off the video each note was made from.
  const { data: videosData } = useVideos(100);

  const [view, setView] = useState<NotesView>(loadView);
  const [term, setTerm] = useState("");
  const [sort, setSort] = useState<SortKey>("latest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // A blocked storage API is no reason to break the page.
    }
  }, [view]);

  const entries = useMemo<Entry[]>(() => {
    const byId = new Map((videosData?.videos ?? []).map((video) => [video.id, video]));
    return (notes ?? []).map((note) => {
      const video = byId.get(note.video_id);
      return {
        note,
        video,
        title: video?.title || headingTitle(note) || "Untitled notes",
        summary: summarise(note.markdown_content),
        thumbnail: youtubeThumbnail(video?.youtube_url),
        duration: formatDuration(video?.duration_seconds),
      };
    });
  }, [notes, videosData]);

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const filtered = needle
      ? entries.filter(
          (entry) =>
            entry.title.toLowerCase().includes(needle) ||
            entry.note.markdown_content.toLowerCase().includes(needle),
        )
      : entries;

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const left = new Date(a.note.created_at).getTime();
      const right = new Date(b.note.created_at).getTime();
      return sort === "oldest" ? left - right : right - left;
    });
    return sorted;
  }, [entries, term, sort]);

  // A filter that shortens the list must not leave the reader stranded on a
  // page that no longer exists.
  useEffect(() => {
    setPage(1);
  }, [term, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = visible.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  if (isLoading) {
    return <LoadingSpinner message="Loading notes..." />;
  }

  const hasNotes = entries.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ---- Masthead ---------------------------------------------------- */}
      {/* Stacked on a phone, where wrapping left the button floating on its
          own line under a left-aligned heading with nothing to align to. */}
      <header className="flex flex-col gap-4 pb-7 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="overline">Library</p>
          <h1 className="page-title mt-2 text-[26px] leading-[1.15] sm:text-[38px]">My Notes</h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-ink-500">
            Everything written from your transcripts and videos.
          </p>
        </div>
        <Link
          to="/submit"
          className="btn-primary inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New notes
        </Link>
      </header>

      {!hasNotes ? (
        <div className="rule py-16 text-center">
          <p className="font-display text-lg font-semibold tracking-[-0.01em] text-ink-900">
            No notes yet
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-500">
            Process a transcript and the first set of notes appears here.
          </p>
          <Link
            to="/submit"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 underline-offset-4 transition-colors hover:text-accent-700 hover:underline"
          >
            Make the first set
          </Link>
        </div>
      ) : (
        <>
          {/* ---- Toolbar ------------------------------------------------- */}
          <div className="rule flex flex-wrap items-center gap-3 pt-5">
            <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search notes…"
                aria-label="Search notes"
                className="h-10 w-full rounded-md border border-line bg-paper-50 pl-9 pr-8 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-ink-600 sm:h-9 sm:text-sm"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 transition-colors hover:text-ink-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex w-full items-center justify-between gap-3 sm:ml-auto sm:w-auto sm:justify-end">
              <label className="flex items-center gap-2 text-xs text-ink-500">
                <span className="hidden sm:inline">Sort by</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  className="h-10 min-w-0 rounded-md border border-line bg-paper-50 px-2.5 text-base text-ink-900 outline-none transition-colors focus:border-ink-600 sm:h-9 sm:text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <ViewToggle value={view} onChange={setView} />
            </div>
          </div>

          {/* ---- Results -------------------------------------------------- */}
          {visible.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-500">
              Nothing matches “<span className="text-ink-900">{term.trim()}</span>”.
            </p>
          ) : view === "grid" ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((entry) => (
                <article
                  key={entry.note.id}
                  className="group flex flex-col overflow-hidden rounded-lg border border-line bg-paper-50 transition-colors hover:border-line-strong"
                >
                  <Link
                    to={`/notes/${entry.note.video_id}`}
                    className="relative block aspect-[16/9] overflow-hidden border-b border-line bg-paper-200"
                  >
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt=""
                        loading="lazy"
                        // A private or removed video serves a placeholder
                        // rather than a 404, so a failed load falls back to the
                        // plain ground underneath.
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <FileText className="h-6 w-6 text-ink-300" aria-hidden="true" />
                      </span>
                    )}
                    {entry.duration && (
                      <span className="absolute bottom-2 right-2 rounded bg-night-900/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
                        {entry.duration}
                      </span>
                    )}
                  </Link>

                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="font-display text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink-900">
                      <Link
                        to={`/notes/${entry.note.video_id}`}
                        className="line-clamp-2 underline-offset-4 hover:underline"
                      >
                        {entry.title}
                      </Link>
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
                      {entry.summary}
                    </p>
                    <p className="mt-3 text-xs text-ink-400">
                      {formatDateTime(entry.note.created_at)}
                    </p>

                    <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                      <Link
                        to={`/notes/${entry.note.video_id}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-line-strong hover:bg-paper-200"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Open
                      </Link>
                      <Link
                        to={`/quiz/${entry.note.video_id}`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-line-strong hover:bg-paper-200"
                      >
                        <GraduationCap className="h-3.5 w-3.5" />
                        Quiz
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-2 border-b border-line">
              {shown.map((entry) => (
                <article key={entry.note.id} className="record-row group hover:bg-paper-200/50">
                  <Link
                    to={`/notes/${entry.note.video_id}`}
                    className="relative hidden h-12 w-[84px] shrink-0 overflow-hidden rounded border border-line bg-paper-200 sm:block"
                  >
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <FileText className="h-4 w-4 text-ink-400" aria-hidden="true" />
                      </span>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink-900">
                      <Link
                        to={`/notes/${entry.note.video_id}`}
                        className="line-clamp-1 underline-offset-4 hover:underline"
                      >
                        {entry.title}
                      </Link>
                    </h2>
                    <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-ink-500">
                      {entry.summary}
                    </p>
                    <p className="mt-1 text-xs text-ink-400">
                      {formatDateTime(entry.note.created_at)}
                      {entry.duration && ` · ${entry.duration}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                    <Link
                      to={`/notes/${entry.note.video_id}`}
                      title="Open notes"
                      aria-label={`Open ${entry.title}`}
                      className="rounded p-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
                    >
                      <FileText className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/quiz/${entry.note.video_id}`}
                      title="Take the quiz"
                      aria-label={`Quiz for ${entry.title}`}
                      className="rounded p-2 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900"
                    >
                      <GraduationCap className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* ---- Count and pages ------------------------------------------ */}
          {visible.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-ink-400">
                Showing {shown.length} of {visible.length}
                {visible.length !== entries.length && ` (of ${entries.length} total)`}
              </p>

              {/* Wraps: a library of a few hundred notes makes more page buttons
                  than fit across a phone in a single row. */}
              {pageCount > 1 && (
                <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Pages">
                  <button
                    type="button"
                    onClick={() => setPage(current - 1)}
                    disabled={current === 1}
                    aria-label="Previous page"
                    className="rounded-md border border-line p-1.5 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setPage(number)}
                      aria-current={number === current ? "page" : undefined}
                      className={cn(
                        "min-w-[32px] rounded-md border px-2 py-1.5 text-xs font-medium tabular-nums transition-colors",
                        number === current
                          ? "border-ink-900 bg-ink-900 text-paper-50"
                          : "border-line text-ink-500 hover:bg-paper-200 hover:text-ink-900",
                      )}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage(current + 1)}
                    disabled={current === pageCount}
                    aria-label="Next page"
                    className="rounded-md border border-line p-1.5 text-ink-500 transition-colors hover:bg-paper-200 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
