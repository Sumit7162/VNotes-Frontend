import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useDarkSurface } from "../../hooks/useDarkSurface";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Rendered under the form, e.g. an error or a notice. */
  footer?: React.ReactNode;
}

/**
 * The frame every authentication screen sits in.
 *
 * One centred column rather than a split with a marketing panel: there is
 * nothing to sell at this point - whoever is here already came for the product -
 * so the page gets out of the way of the six fields that matter. The
 * typographic rhythm is the same as the rest of the app: an overline, a serif
 * heading, a standfirst, then a rule.
 *
 * The surface is pinned dark regardless of the chosen theme, because this is
 * the public face of the product and should look the same to everyone arriving
 * at it.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  useDarkSurface();

  return (
    <div className="flex min-h-screen flex-col bg-paper-100 px-5 py-7 sm:px-8">
      <Link to="/" className="inline-flex items-center gap-2.5 self-start">
        <img
          src="/logo-tile.png"
          alt=""
          width={30}
          height={30}
          className="h-[30px] w-[30px] rounded-md object-cover"
        />
        <span className="font-display text-base font-semibold tracking-[-0.01em] text-ink-900">
          V-Notes AI
        </span>
      </Link>

      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[380px]">
          <p className="overline">Account</p>
          <h1 className="page-title mt-2 text-[28px] leading-[1.2]">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{subtitle}</p>
          )}

          <div className="rule mt-7 pt-7">{children}</div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </main>

      <footer className="flex items-center justify-between gap-4 text-xs text-ink-400">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-ink-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to home
        </Link>
        <span className="hidden sm:block">Watch less. Learn more.</span>
      </footer>
    </div>
  );
}
