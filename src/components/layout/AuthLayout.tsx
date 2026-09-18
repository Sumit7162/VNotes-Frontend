import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useTheme } from "../../hooks/useTheme";

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
 * One block, centred in the viewport, on the ordinary page ground. It follows
 * the reader's chosen theme like the rest of the app rather than pinning itself
 * dark: a near-black sign-in page in front of someone running the app in light
 * mode reads as a different product, not as a considered choice.
 *
 * useTheme is called for its effect, not its value. Nothing else on these
 * routes mounts it, and without it a visitor who opens /login directly gets the
 * default light ground whatever they had chosen.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  useTheme();

  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper-100 px-4 py-8 sm:px-5 sm:py-10">
      <div className="w-full max-w-[460px]">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <img
            src="/logo-tile.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-cover"
          />
          <span className="font-display text-base font-semibold tracking-[-0.01em] text-ink-900">
            V-Notes AI
          </span>
        </Link>

        <div className="mt-9">
          <p className="overline">Account</p>
          <h1 className="page-title mt-2 text-2xl leading-[1.2] sm:text-[28px]">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{subtitle}</p>
          )}
        </div>

        <div className="rule mt-7 pt-7">{children}</div>

        {footer && <div className="mt-6">{footer}</div>}

        <div className="rule mt-9 flex items-center justify-between gap-4 pt-5 text-xs text-ink-400">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-ink-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to home
          </Link>
          <span className="hidden sm:block">Watch less. Learn more.</span>
        </div>
      </div>
    </div>
  );
}
