import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A coverflow walk-through of the product.
 *
 * The screens are drawn in markup rather than captured as images: a screenshot
 * of an interface that is still being designed is out of date the day it is
 * taken, and at this size the shapes are what read anyway - nobody is going to
 * study the body text of a thumbnail. Built this way they also inherit the page
 * palette, stay crisp at any zoom and cost nothing to download.
 *
 * The neighbours are rotated about the Y axis under a shared perspective, so
 * each one foreshortens into a trapezium - narrow on the outer edge, tall on the
 * inner - which is what makes the row read as a stack turning towards you.
 */

// How far each step from the centre is pushed out, turned, and shrunk. Three
// positions a side is plenty: past that a card is too small to read as a screen.
const PLACEMENT = [
  { x: 0, rotate: 0, scale: 1, opacity: 1, blur: 0 },
  { x: 56, rotate: 34, scale: 0.84, opacity: 0.6, blur: 1 },
  { x: 96, rotate: 42, scale: 0.7, opacity: 0.28, blur: 2 },
];

interface Slide {
  id: string;
  label: string;
  title: string;
  body: string;
  screen: React.ReactNode;
}

// ---------------------------------------------------------------------------
// The drawn screens
// ---------------------------------------------------------------------------

/** A line of "text". Width is a percentage so rows look set, not tiled. */
function Line({ w, className }: { w: number; className?: string }) {
  return (
    <span
      className={cn("block h-1.5 rounded-full bg-white/[0.12]", className)}
      style={{ width: `${w}%` }}
    />
  );
}

function Window({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/[0.12] bg-[#0B1018] shadow-2xl">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
          <span className="h-2 w-2 rounded-full bg-white/20" />
        </span>
        <span className="truncate text-[10px] font-medium tracking-wide text-white/40">
          {title}
        </span>
      </div>
      <div className="min-h-0 flex-1 p-3.5">{children}</div>
    </div>
  );
}

function TranscriptScreen() {
  return (
    <Window title="Make notes">
      <div className="flex gap-3 border-b border-white/10 pb-2 text-[10px]">
        <span className="border-b-2 border-white/60 pb-1.5 text-white/70">Transcript</span>
        <span className="pb-1.5 text-white/25">YouTube link</span>
      </div>
      <div className="mt-3 space-y-2">
        <Line w={26} className="bg-white/25" />
        <div className="h-6 rounded border border-white/[0.12] bg-white/[0.03]" />
      </div>
      <div className="mt-3 space-y-2 rounded border border-dashed border-white/15 bg-white/[0.02] p-3">
        <Line w={88} />
        <Line w={94} />
        <Line w={72} />
        <Line w={90} />
        <Line w={40} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded bg-accent-600 px-3 py-1.5 text-[10px] font-semibold text-white">
          Write the notes
        </span>
        <span className="text-[9px] text-white/30">2,410 words</span>
      </div>
    </Window>
  );
}

function NotesScreen() {
  return (
    <Window title="Positional encoding — notes">
      <div className="space-y-1.5">
        <span className="block h-2.5 w-2/3 rounded bg-white/35" />
        <Line w={34} className="bg-white/15" />
      </div>
      <div className="mt-3.5 space-y-1.5">
        <Line w={96} />
        <Line w={91} />
        <Line w={76} />
      </div>
      <div className="mt-3 rounded border border-white/10 bg-white/[0.03] px-2.5 py-2 text-center">
        <span className="font-mono text-[10px] text-cyan-300/70">PE(pos,2i) = sin(pos/10000)</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
          <Line w={70} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
          <Line w={82} />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-cyan-400/60" />
          <Line w={58} />
        </div>
      </div>
    </Window>
  );
}

function LibraryScreen() {
  return (
    <Window title="My notes">
      <div className="flex items-center gap-2">
        <div className="h-5 flex-1 rounded border border-white/[0.12] bg-white/[0.03]" />
        <div className="h-5 w-10 rounded border border-white/[0.12] bg-white/[0.03]" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          "from-violet-600/40 to-accent-700/40",
          "from-cyan-600/40 to-accent-800/40",
          "from-accent-600/40 to-violet-700/40",
          "from-accent-700/40 to-cyan-700/40",
          "from-violet-700/40 to-accent-600/40",
          "from-cyan-700/40 to-violet-600/40",
        ].map((tint, index) => (
          <div key={index} className="overflow-hidden rounded border border-white/10">
            <div className={cn("h-7 bg-gradient-to-br", tint)} />
            <div className="space-y-1 p-1.5">
              <Line w={90} className="bg-white/20" />
              <Line w={55} />
            </div>
          </div>
        ))}
      </div>
    </Window>
  );
}

function QuizScreen() {
  return (
    <Window title="Quiz">
      <div className="flex items-center justify-between">
        <Line w={22} className="bg-white/25" />
        <span className="text-[9px] text-white/30">3 / 10</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[30%] rounded-full bg-accent-500" />
      </div>
      <div className="mt-3 space-y-1.5">
        <Line w={94} className="bg-white/30" />
        <Line w={62} className="bg-white/30" />
      </div>
      <div className="mt-3 space-y-1.5">
        {[false, true, false, false].map((correct, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-1.5",
              correct
                ? "border-success-600/60 bg-success-600/15"
                : "border-white/10 bg-white/[0.02]",
            )}
          >
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                correct ? "bg-success-600" : "bg-white/15",
              )}
            />
            <Line w={correct ? 64 : 52} className={correct ? "bg-white/35" : undefined} />
          </div>
        ))}
      </div>
    </Window>
  );
}

const slides: Slide[] = [
  {
    id: "transcript",
    label: "Step one",
    title: "Hand over the transcript",
    body: "Paste the text or drop a .txt, .md, .srt or .vtt file. Caption timings and numbering are stripped for you, and there is no length limit.",
    screen: <TranscriptScreen />,
  },
  {
    id: "notes",
    label: "Step two",
    title: "Get notes, not a summary",
    body: "Headings, key points, formulas and tables — read in passes so the notes cover the whole thing rather than just the opening.",
    screen: <NotesScreen />,
  },
  {
    id: "library",
    label: "Step three",
    title: "Everything in one library",
    body: "Search across every set of notes you have made, sort them, and open any of them again. Export to PDF or markdown whenever you want.",
    screen: <LibraryScreen />,
  },
  {
    id: "quiz",
    label: "Step four",
    title: "Check what stuck",
    body: "Turn any set of notes into a quiz, answer it, and see which questions you missed with the reasoning spelled out.",
    screen: <QuizScreen />,
  },
];

// ---------------------------------------------------------------------------

export function AppShowcase() {
  const [index, setIndex] = useState(0);
  const dragStart = useRef<number | null>(null);
  // A swipe ends in a click on whichever card was under the finger, which
  // would then pull that card to the centre and undo the swipe. This marks the
  // gesture so the click that follows it is ignored.
  const swiped = useRef(false);

  const go = useCallback((next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length);
  }, []);

  // Arrow keys work whenever the carousel itself holds focus, not globally -
  // a page-wide listener would hijack the arrows for anyone simply scrolling.
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  useEffect(() => {
    dragStart.current = null;
  }, [index]);

  const current = slides[index];

  return (
    <div>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="How V-Notes AI works"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          dragStart.current = event.clientX;
          swiped.current = false;
        }}
        onPointerUp={(event) => {
          if (dragStart.current === null) return;
          const travelled = event.clientX - dragStart.current;
          // Enough to be a swipe rather than a tap on a card.
          if (Math.abs(travelled) > 45) {
            swiped.current = true;
            go(index + (travelled < 0 ? 1 : -1));
          }
          dragStart.current = null;
        }}
        onPointerLeave={() => {
          dragStart.current = null;
        }}
        className="relative h-[260px] touch-pan-y select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 sm:h-[320px]"
        style={{ perspective: "1400px" }}
      >
        {slides.map((slide, position) => {
          // Shortest way round, so stepping past the last card wraps rather
          // than sweeping the whole row back the other way.
          let offset = position - index;
          if (offset > slides.length / 2) offset -= slides.length;
          if (offset < -slides.length / 2) offset += slides.length;

          const depth = Math.min(Math.abs(offset), PLACEMENT.length - 1);
          const place = PLACEMENT[depth];
          const side = Math.sign(offset);
          const hidden = Math.abs(offset) >= PLACEMENT.length;
          const isCurrent = offset === 0;

          return (
            <div
              key={slide.id}
              aria-hidden={!isCurrent}
              className={cn(
                "absolute left-1/2 top-1/2 h-[240px] w-[300px] -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out sm:h-[290px] sm:w-[380px]",
                hidden && "pointer-events-none",
                !isCurrent && !hidden && "cursor-pointer",
              )}
              style={{
                transform: `translate(-50%, -50%) translateX(${side * place.x}%) rotateY(${-side * place.rotate}deg) scale(${place.scale})`,
                opacity: hidden ? 0 : place.opacity,
                filter: place.blur ? `blur(${place.blur}px)` : undefined,
                zIndex: slides.length - depth,
              }}
              onClick={() => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                if (!isCurrent && !hidden) go(position);
              }}
            >
              {slide.screen}
              {/* Darkens the neighbours from their outer edge inwards, which is
                  what stops the turned cards reading as flat rectangles that
                  merely happen to be smaller. */}
              {!isCurrent && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    background: `linear-gradient(${side > 0 ? 270 : 90}deg, rgba(6,7,10,0.72) 0%, rgba(6,7,10,0.12) 65%, transparent 100%)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Controls and caption ---------------------------------------- */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous screen"
          className="rounded-full border border-night-line home-panel p-2 text-ink-600 transition-colors hover:border-accent-500 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((slide, position) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(position)}
              aria-label={slide.title}
              aria-current={position === index ? "true" : undefined}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                position === index ? "w-6 bg-accent-500" : "w-1.5 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next screen"
          className="rounded-full border border-night-line home-panel p-2 text-ink-600 transition-colors hover:border-accent-500 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* aria-live so the caption change is announced when the slide moves. */}
      <div aria-live="polite" className="mx-auto mt-6 max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/70">
          {current.label}
        </p>
        <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {current.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{current.body}</p>
      </div>
    </div>
  );
}
