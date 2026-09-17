import { useCallback, useRef, useState } from "react";
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
 *
 * Every screen carries one hue of its own. It is what separates seven dark
 * rectangles from seven recognisable places, and it means a glance at the row
 * tells you roughly where in the product you are.
 */

// How far each step from the centre is pushed out, turned, and shrunk. Three
// positions a side is plenty: past that a card is too small to read as a screen.
const PLACEMENT = [
  { x: 0, rotate: 0, scale: 1, opacity: 1, blur: 0 },
  { x: 54, rotate: 33, scale: 0.84, opacity: 0.68, blur: 0.6 },
  { x: 93, rotate: 41, scale: 0.7, opacity: 0.32, blur: 1.8 },
];

/** The per-screen hue, as raw channels so glows and tints can share it. */
type Hue = { rgb: string; text: string; ring: string };

const HUES = {
  indigo: { rgb: "99 102 241", text: "text-indigo-300", ring: "ring-indigo-400/25" },
  sky: { rgb: "56 189 248", text: "text-sky-300", ring: "ring-sky-400/25" },
  violet: { rgb: "139 92 246", text: "text-violet-200", ring: "ring-violet-400/25" },
  emerald: { rgb: "52 211 153", text: "text-emerald-300", ring: "ring-emerald-400/25" },
  amber: { rgb: "251 191 36", text: "text-amber-300", ring: "ring-amber-400/25" },
  rose: { rgb: "244 114 182", text: "text-rose-300", ring: "ring-rose-400/25" },
  teal: { rgb: "45 212 191", text: "text-teal-300", ring: "ring-teal-400/25" },
} satisfies Record<string, Hue>;

type HueName = keyof typeof HUES;

interface Slide {
  id: string;
  hue: HueName;
  label: string;
  title: string;
  body: string;
  screen: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Pieces the drawn screens are made of
// ---------------------------------------------------------------------------

/** A line of "text". Width is a percentage so rows look set, not tiled. */
function Line({ w, className }: { w: number; className?: string }) {
  return (
    <span
      className={cn("block h-1.5 rounded-full bg-white/[0.14]", className)}
      style={{ width: `${w}%` }}
    />
  );
}

function Pill({
  children,
  rgb,
}: {
  children: React.ReactNode;
  rgb: string;
}) {
  return (
    <span
      className="rounded-full px-1.5 py-0.5 text-[8px] font-semibold"
      style={{ background: `rgb(${rgb} / 0.18)`, color: `rgb(${rgb})` }}
    >
      {children}
    </span>
  );
}

function Window({
  title,
  hue,
  children,
}: {
  title: string;
  hue: HueName;
  children: React.ReactNode;
}) {
  const { rgb } = HUES[hue];
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-xl border bg-[#0A0F17]"
      style={{
        borderColor: `rgb(${rgb} / 0.22)`,
        boxShadow: `0 20px 50px -20px rgb(${rgb} / 0.45), 0 0 0 1px rgb(255 255 255 / 0.04) inset`,
      }}
    >
      {/* A wash of the screen's own colour off the top edge, so the window has
          a light source rather than being a flat dark panel. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, rgb(${rgb} / 0.20), transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-2 border-b border-white/[0.08] px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: `rgb(${rgb} / 0.55)` }} />
          <span className="h-2 w-2 rounded-full bg-white/[0.15]" />
          <span className="h-2 w-2 rounded-full bg-white/[0.15]" />
        </span>
        <span className="truncate text-[10px] font-medium tracking-wide text-white/[0.45]">
          {title}
        </span>
      </div>
      <div className="relative min-h-0 flex-1 p-3.5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The screens
// ---------------------------------------------------------------------------

function DashboardScreen() {
  const { rgb } = HUES.indigo;
  return (
    <Window title="Dashboard" hue="indigo">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="block h-2 w-24 rounded bg-white/40" />
          <Line w={60} />
        </div>
        <span
          className="rounded px-2 py-1 text-[8px] font-semibold text-white"
          style={{ background: `rgb(${rgb} / 0.9)` }}
        >
          New notes
        </span>
      </div>

      <div
        className="mt-3 rounded-lg border p-2.5"
        style={{
          borderColor: `rgb(${rgb} / 0.25)`,
          background: `linear-gradient(110deg, rgb(${rgb} / 0.22), rgb(139 92 246 / 0.14))`,
        }}
      >
        <Line w={44} className="bg-white/[0.45]" />
        <div className="mt-2 flex gap-1.5">
          <div className="h-4 flex-1 rounded border border-white/[0.15] bg-black/25" />
          <div className="h-4 w-14 rounded bg-white/[0.85]" />
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {[
          { w: 68, pill: "Ready", hue: "52 211 153" },
          { w: 54, pill: "Writing", hue: "251 191 36" },
          { w: 60, pill: "Ready", hue: "52 211 153" },
        ].map((row, index) => (
          <div key={index} className="flex items-center gap-2 border-t border-white/[0.06] pt-1.5">
            <div
              className="h-5 w-8 shrink-0 rounded"
              style={{
                background: `linear-gradient(135deg, rgb(${rgb} / 0.5), rgb(56 189 248 / 0.3))`,
              }}
            />
            <Line w={row.w} className="bg-white/[0.22]" />
            <span className="ml-auto">
              <Pill rgb={row.hue}>{row.pill}</Pill>
            </span>
          </div>
        ))}
      </div>
    </Window>
  );
}

function TranscriptScreen() {
  const { rgb } = HUES.sky;
  return (
    <Window title="Make notes" hue="sky">
      <div className="flex gap-3 border-b border-white/[0.08] pb-2 text-[10px]">
        <span
          className="pb-1.5"
          style={{ color: `rgb(${rgb})`, boxShadow: `inset 0 -2px 0 rgb(${rgb})` }}
        >
          Transcript
        </span>
        <span className="pb-1.5 text-white/25">YouTube link</span>
      </div>

      <div className="mt-3 space-y-1.5">
        <Line w={22} className="bg-white/[0.35]" />
        <div className="h-5 rounded border border-white/[0.12] bg-white/[0.03]" />
      </div>

      <div
        className="mt-3 space-y-1.5 rounded-lg border border-dashed p-3"
        style={{ borderColor: `rgb(${rgb} / 0.35)`, background: `rgb(${rgb} / 0.06)` }}
      >
        <Line w={88} />
        <Line w={95} />
        <Line w={72} />
        <Line w={90} />
        <Line w={44} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className="rounded px-3 py-1.5 text-[9px] font-semibold text-white"
          style={{ background: `rgb(${rgb} / 0.9)` }}
        >
          Write the notes
        </span>
        <span className="text-[8px] text-white/[0.35]">2,410 words · ≈ 16 min</span>
      </div>
    </Window>
  );
}

function NotesScreen() {
  const { rgb } = HUES.violet;
  return (
    <Window title="Positional encoding — notes" hue="violet">
      <div className="space-y-1.5">
        <span className="block h-2.5 w-2/3 rounded bg-white/[0.45]" />
        <Line w={34} className="bg-white/[0.18]" />
      </div>

      <div className="mt-3 space-y-1.5">
        <Line w={96} />
        <Line w={90} />
        <Line w={76} />
      </div>

      <div
        className="mt-3 rounded-md border px-2.5 py-2 text-center"
        style={{ borderColor: `rgb(${rgb} / 0.3)`, background: `rgb(${rgb} / 0.10)` }}
      >
        <span className="font-mono text-[10px]" style={{ color: `rgb(${rgb})` }}>
          PE(pos,2i) = sin(pos / 10000^(2i/d))
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {[70, 84, 58].map((w) => (
          <div key={w} className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full" style={{ background: `rgb(${rgb})` }} />
            <Line w={w} />
          </div>
        ))}
      </div>

      <div className="mt-3 overflow-hidden rounded border border-white/[0.08]">
        <div className="flex gap-2 px-2 py-1" style={{ background: `rgb(${rgb} / 0.14)` }}>
          <Line w={30} className="bg-white/30" />
          <Line w={22} className="bg-white/30" />
        </div>
        <div className="flex gap-2 px-2 py-1">
          <Line w={34} />
          <Line w={18} />
        </div>
      </div>
    </Window>
  );
}

function LibraryScreen() {
  const { rgb } = HUES.teal;
  return (
    <Window title="My notes" hue="teal">
      <div className="flex items-center gap-2">
        <div
          className="h-5 flex-1 rounded border"
          style={{ borderColor: `rgb(${rgb} / 0.25)`, background: `rgb(${rgb} / 0.07)` }}
        />
        <div className="h-5 w-9 rounded border border-white/[0.12] bg-white/[0.03]" />
        <div className="h-5 w-9 rounded border border-white/[0.12] bg-white/[0.03]" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          "linear-gradient(135deg, rgb(99 102 241 / 0.75), rgb(56 189 248 / 0.45))",
          "linear-gradient(135deg, rgb(244 114 182 / 0.7), rgb(139 92 246 / 0.5))",
          "linear-gradient(135deg, rgb(45 212 191 / 0.7), rgb(56 189 248 / 0.45))",
          "linear-gradient(135deg, rgb(251 191 36 / 0.65), rgb(244 114 182 / 0.45))",
          "linear-gradient(135deg, rgb(139 92 246 / 0.7), rgb(99 102 241 / 0.5))",
          "linear-gradient(135deg, rgb(52 211 153 / 0.65), rgb(45 212 191 / 0.45))",
        ].map((tint, index) => (
          <div key={index} className="overflow-hidden rounded border border-white/[0.09]">
            <div className="relative h-7" style={{ background: tint }}>
              <span className="absolute bottom-0.5 right-0.5 rounded bg-black/55 px-1 text-[6px] font-medium text-white/[0.85]">
                1:18
              </span>
            </div>
            <div className="space-y-1 p-1.5">
              <Line w={92} className="bg-white/[0.28]" />
              <Line w={55} />
            </div>
          </div>
        ))}
      </div>
    </Window>
  );
}

function QuizScreen() {
  const { rgb } = HUES.amber;
  return (
    <Window title="Quiz" hue="amber">
      <div className="flex items-center justify-between">
        <Line w={22} className="bg-white/[0.35]" />
        <span className="text-[8px] tabular-nums text-white/40">3 / 10</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[30%] rounded-full" style={{ background: `rgb(${rgb})` }} />
      </div>

      <div className="mt-3 space-y-1.5">
        <Line w={94} className="bg-white/[0.38]" />
        <Line w={58} className="bg-white/[0.38]" />
      </div>

      <div className="mt-3 space-y-1.5">
        {[false, true, false, false].map((correct, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-md border px-2 py-1.5"
            style={
              correct
                ? { borderColor: "rgb(52 211 153 / 0.55)", background: "rgb(52 211 153 / 0.14)" }
                : { borderColor: "rgb(255 255 255 / 0.08)", background: "rgb(255 255 255 / 0.02)" }
            }
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                background: correct ? "rgb(52 211 153)" : "rgb(255 255 255 / 0.16)",
              }}
            />
            <Line w={correct ? 64 : 52} className={correct ? "bg-white/40" : undefined} />
          </div>
        ))}
      </div>
    </Window>
  );
}

function ScoreScreen() {
  const { rgb } = HUES.emerald;
  return (
    <Window title="Quiz results" hue="emerald">
      <div className="flex items-center gap-4">
        {/* The ring is a conic gradient masked to a band - a real arc, with no
            SVG and no library. */}
        <div
          className="relative grid h-16 w-16 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(rgb(${rgb}) 0turn 0.8turn, rgb(255 255 255 / 0.08) 0.8turn 1turn)`,
          }}
        >
          <div className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#0A0F17]">
            <span className="text-[13px] font-semibold tabular-nums text-white">80%</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Line w={62} className="bg-white/40" />
          <Line w={44} />
          <div className="flex gap-1.5 pt-1">
            <Pill rgb="52 211 153">8 right</Pill>
            <Pill rgb="244 114 182">2 missed</Pill>
          </div>
        </div>
      </div>

      <div className="mt-3.5 space-y-2 border-t border-white/[0.07] pt-3">
        {[
          { w: 88, tint: "52 211 153" },
          { w: 64, tint: "52 211 153" },
          { w: 40, tint: "244 114 182" },
        ].map((row, index) => (
          <div key={index} className="space-y-1">
            <Line w={row.w} />
            <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full"
                style={{ width: `${row.w}%`, background: `rgb(${row.tint} / 0.8)` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Window>
  );
}

function ExportScreen() {
  const { rgb } = HUES.rose;
  return (
    <Window title="Export" hue="rose">
      <div className="flex gap-3">
        {/* A sheet of paper, light against everything else on the page. */}
        <div className="h-[104px] w-[72px] shrink-0 space-y-1.5 rounded border border-white/[0.15] bg-white/90 p-2">
          <span className="block h-1.5 w-3/4 rounded bg-slate-800/70" />
          <span className="block h-1 w-full rounded bg-slate-400/60" />
          <span className="block h-1 w-5/6 rounded bg-slate-400/60" />
          <span className="block h-1 w-full rounded bg-slate-400/60" />
          <span className="block h-4 w-full rounded bg-slate-200" />
          <span className="block h-1 w-2/3 rounded bg-slate-400/60" />
          <span className="block h-1 w-5/6 rounded bg-slate-400/60" />
        </div>

        <div className="min-w-0 flex-1">
          <Line w={70} className="bg-white/40" />
          <div className="mt-2.5 space-y-1.5">
            {["PDF", "Markdown", "Print"].map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5"
                style={{
                  borderColor: index === 0 ? `rgb(${rgb} / 0.5)` : "rgb(255 255 255 / 0.08)",
                  background: index === 0 ? `rgb(${rgb} / 0.14)` : "transparent",
                }}
              >
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{
                    background: index === 0 ? `rgb(${rgb})` : "rgb(255 255 255 / 0.18)",
                  }}
                />
                <span
                  className="text-[9px] font-medium"
                  style={{ color: index === 0 ? `rgb(${rgb})` : "rgb(255 255 255 / 0.4)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          <span className="mt-2.5 block truncate font-mono text-[8px] text-white/30">
            positional-encoding.pdf
          </span>
        </div>
      </div>
    </Window>
  );
}

const slides: Slide[] = [
  {
    id: "dashboard",
    hue: "indigo",
    label: "Where you land",
    title: "Everything in progress, at a glance",
    body: "What is being written, what is finished, and one way in to start the next set. No hunting for the button.",
    screen: <DashboardScreen />,
  },
  {
    id: "transcript",
    hue: "sky",
    label: "Step one",
    title: "Hand over the transcript",
    body: "Paste the text or drop a .txt, .md, .srt or .vtt file. Caption timings and numbering are stripped for you, and there is no length limit.",
    screen: <TranscriptScreen />,
  },
  {
    id: "notes",
    hue: "violet",
    label: "Step two",
    title: "Get notes, not a summary",
    body: "Headings, key points, rendered formulas and real tables — read in passes, so the notes cover the whole thing rather than the opening.",
    screen: <NotesScreen />,
  },
  {
    id: "library",
    hue: "teal",
    label: "Step three",
    title: "Everything in one library",
    body: "Search across every set of notes you have made, sort them however you like, and open any of them again in a click.",
    screen: <LibraryScreen />,
  },
  {
    id: "quiz",
    hue: "amber",
    label: "Step four",
    title: "Check what actually stuck",
    body: "Turn any set of notes into multiple-choice questions and answer them while the material is still fresh.",
    screen: <QuizScreen />,
  },
  {
    id: "score",
    hue: "emerald",
    label: "Step five",
    title: "See what you missed, and why",
    body: "Every attempt is scored and kept, with the reasoning behind each answer spelled out so a wrong one teaches you something.",
    screen: <ScoreScreen />,
  },
  {
    id: "export",
    hue: "rose",
    label: "Step six",
    title: "Take it with you",
    body: "Print to PDF or save the markdown. The file is named after the topic you gave, so it still makes sense a month later.",
    screen: <ExportScreen />,
  },
];

// ---------------------------------------------------------------------------

export function AppShowcase() {
  const [index, setIndex] = useState(0);
  const dragStart = useRef<number | null>(null);
  // A swipe ends in a click on whichever card was under the finger, which would
  // then pull that card to the centre and undo the swipe. This marks the
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

  const current = slides[index];
  const currentHue = HUES[current.hue];

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
        className="relative h-[270px] touch-pan-y select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 sm:h-[330px]"
        style={{ perspective: "1400px" }}
      >
        {/* The stage glow takes the colour of whichever screen is in front, so
            the whole section shifts hue as the stack turns. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-all duration-700"
          style={{ background: `radial-gradient(closest-side, rgb(${currentHue.rgb} / 0.22), transparent)` }}
        />

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
                    background: `linear-gradient(${side > 0 ? 270 : 90}deg, rgba(8,9,14,0.74) 0%, rgba(8,9,14,0.14) 65%, transparent 100%)`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Controls and caption ---------------------------------------- */}
      <div className="mt-7 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous screen"
          className="rounded-full border border-night-line home-panel p-2 text-ink-600 transition-colors hover:border-accent-500 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((slide, position) => {
            const active = position === index;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(position)}
                aria-label={slide.title}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  active ? "w-6" : "w-1.5 bg-white/20 hover:bg-white/40",
                )}
                style={active ? { background: `rgb(${HUES[slide.hue].rgb})` } : undefined}
              />
            );
          })}
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
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: `rgb(${currentHue.rgb})` }}
        >
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
