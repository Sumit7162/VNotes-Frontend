import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Sparkles, Video } from "lucide-react";

import { useDarkSurface } from "../../hooks/useDarkSurface";

const pipeline = [
  { icon: Video, label: "YouTube Video", detail: "Paste any link" },
  { icon: Sparkles, label: "AI", detail: "Reads and summarises it" },
  { icon: FileText, label: "Structured Notes", detail: "Yours to keep and revise" },
];

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Rendered under the card, e.g. a link back to sign in. */
  footer?: React.ReactNode;
}

/**
 * The frame every authentication screen sits in.
 *
 * One layout for sign-in, sign-up, verification and password reset, so the five
 * screens read as one product rather than five pages that happen to share a
 * logo. The right-hand panel repeats the pipeline the dashboard hero shows,
 * which is the clearest statement of what the account is for.
 *
 * The whole surface is pinned dark regardless of the chosen theme: this is the
 * public face of the product, and it should look the same to everyone arriving
 * at it.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  useDarkSurface();

  return (
    <div className="min-h-screen bg-paper-100 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      {/* ---- Form side ---------------------------------------------------- */}
      <div className="flex min-h-screen flex-col px-5 py-8 sm:px-8 lg:min-h-0 lg:px-12">
        <Link to="/" className="inline-flex items-center gap-2.5 self-start">
          <img
            src="/logo-tile.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900">
            V-Notes AI
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[400px]">
            <h1 className="page-title text-2xl">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}

            <div className="mt-6">{children}</div>

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 self-start text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
      </div>

      {/* ---- Brand side --------------------------------------------------- */}
      <aside className="relative hidden overflow-hidden border-l border-line lg:flex lg:flex-col lg:justify-center">
        <div className="hero-surface absolute inset-0" aria-hidden="true" />
        <div className="hero-grid absolute inset-0 opacity-40" aria-hidden="true" />

        <div className="relative px-12 py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
            Study notes, without the typing
          </p>
          <h2 className="mt-3 max-w-sm font-display text-[26px] font-semibold leading-snug tracking-tight text-white">
            Turn any video into notes worth keeping.
          </h2>

          <ol className="mt-9 space-y-1">
            {pipeline.map((stage, index) => {
              const Icon = stage.icon;
              return (
                <li key={stage.label}>
                  <div className="flex items-start gap-3.5 rounded-xl bg-white/10 px-4 py-3.5 ring-1 ring-inset ring-white/15">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/85" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{stage.label}</p>
                      <p className="mt-0.5 text-xs text-white/60">{stage.detail}</p>
                    </div>
                  </div>
                  {index < pipeline.length - 1 && (
                    <div className="flex pl-7 py-1">
                      <span className="h-3 w-px bg-white/25" aria-hidden="true" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
}
