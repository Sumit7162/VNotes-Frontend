import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  Layers,
  Search,
  ShieldCheck,
  Sigma,
} from "lucide-react";

import { BackgroundPaths } from "@/components/ui/background-paths";
import { AppShowcase } from "@/components/landing/AppShowcase";
import { YOUTUBE_SUBMISSION_LOCKED } from "@/lib/features";
import { useAuth } from "../hooks/useAuth";
import { useDarkSurface } from "../hooks/useDarkSurface";

const features = [
  {
    icon: Layers,
    title: "The whole thing, not the first ten minutes",
    body: "A long transcript is read in slices and stitched back together, so the notes cover the end of a two-hour lecture as carefully as the opening.",
  },
  {
    icon: Sigma,
    title: "Formulas and tables survive",
    body: "Maths is rendered properly rather than left as raw TeX, and tables come through as tables. Technical material stays readable.",
  },
  {
    icon: FileText,
    title: "Structured markdown",
    body: "Headings, key points, definitions and worked examples — laid out so you can skim for the part you need instead of re-reading everything.",
  },
  {
    icon: GraduationCap,
    title: "Quizzes from your own notes",
    body: "Turn any set of notes into multiple-choice questions, answer them, and see what you missed with the reasoning spelled out.",
  },
  {
    icon: Search,
    title: "A library you can search",
    body: "Every set of notes is kept and indexed. Find one by its title or by something you remember reading inside it.",
  },
  {
    icon: Download,
    title: "Yours to take away",
    body: "Print to PDF or save the markdown. The export is named after the topic you gave, so the file makes sense a month later.",
  },
];

const formats = [".txt", ".md", ".srt", ".vtt"];

export function HomePage() {
  const { isSignedIn } = useAuth();

  // The public surface is dark; the signed-in app stays light.
  useDarkSurface("#0A0716");

  return (
    // One ground for the whole page: the hero is transparent and sits on this,
    // so the glows run behind it and the sections below meet it with no seam.
    <div className="home-surface text-ink-700">
      {/* BackgroundPaths is min-h-screen and takes no layout props, so the page
          is built around it: the hero owns the first screen outright, and the
          header and scroll cue sit over it rather than taking height from it. */}
      <div className="relative">
        <BackgroundPaths title="V-Notes AI" ctaHref="#pitch" />

        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo-tile.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl ring-1 ring-white/10"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-white">
              V-Notes AI
            </span>
          </div>

          <Link
            to={isSignedIn ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white"
          >
            {isSignedIn ? "Open dashboard" : "Sign in"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <a
          href="#pitch"
          aria-label="Scroll to find out more"
          className="absolute inset-x-0 bottom-5 z-20 mx-auto flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-white/60 backdrop-blur-md transition-colors hover:border-white/30 hover:text-white"
        >
          Scroll
          <ChevronDown className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* ---- The pitch ---------------------------------------------------- */}
      <section id="pitch" className="mx-auto w-full max-w-3xl px-5 py-20 text-center sm:px-8">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Turn any video into notes worth keeping
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600">
          {YOUTUBE_SUBMISSION_LOCKED
            ? "Hand over a transcript and get structured study notes back in minutes — headings, key points, formulas and tables, ready to read or print."
            : "Paste a YouTube link and get structured study notes back in seconds — headings, key points, formulas and tables, ready to read or print."}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={isSignedIn ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-accent-800/30 transition-colors hover:bg-accent-500"
          >
            {isSignedIn ? "Open dashboard" : "Get started free"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center rounded-lg border border-night-line home-panel px-5 py-3 text-sm font-medium text-ink-700 transition-colors hover:border-accent-500 hover:text-white"
          >
            How it works
          </a>
        </div>
      </section>

      {/* ---- Walk-through -------------------------------------------------- */}
      <section
        id="how-it-works"
        className="mx-auto w-full max-w-5xl overflow-hidden px-5 pb-20 sm:px-8"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/70">
            How it works
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Four screens, start to finish
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600">
            Drag the stack, use the arrows, or click a screen either side to bring it forward.
          </p>
        </div>

        <div className="mt-14">
          <AppShowcase />
        </div>
      </section>

      {/* ---- What it does -------------------------------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-400/70">
            What you get
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Notes you would have written yourself
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-600">
            If you had the three hours. The point is not a summary — it is a document you can
            revise from a week later.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-night-line home-panel p-5 transition-colors hover:border-accent-600"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl home-tile text-cyan-400 ring-1 ring-inset ring-night-line">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-display text-[17px] font-semibold leading-snug text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{feature.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- The details worth stating -------------------------------------- */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-24 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-night-line home-panel p-6">
            <h3 className="font-display text-xl font-semibold text-white">
              Bring your own transcript
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
              Paste the text straight in, or drop a caption file. Timings and numbering are
              stripped automatically, and there is no length limit on what you upload.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {formats.map((format) => (
                <li
                  key={format}
                  className="rounded-md border border-night-line home-tile px-2.5 py-1 font-mono text-xs text-cyan-300/80"
                >
                  {format}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-night-line home-panel p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl home-tile text-cyan-400 ring-1 ring-inset ring-night-line">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-display text-xl font-semibold text-white">
              Your material stays yours
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-600">
              Notes belong to the account that made them. Nothing is published, nothing is
              shared, and you can delete any set of notes — and the transcript behind it — at
              any time.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to={isSignedIn ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-accent-800/30 transition-colors hover:bg-accent-500"
          >
            {isSignedIn ? "Open dashboard" : "Make your first set of notes"}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-ink-500">Free to start. No card required.</p>
        </div>
      </section>

      <footer className="border-t border-night-line px-5 py-6 text-center text-xs text-ink-500 sm:px-8">
        V-Notes AI — study notes from any video
      </footer>
    </div>
  );
}

export default HomePage;
