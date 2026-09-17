import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { authApi, errorMessage, saveSession } from "@/services/auth";

/**
 * Where the link in the verification email lands.
 *
 * The token goes straight back to the API, and a session token comes back with
 * the result - so following the link both activates the account and signs the
 * person in, rather than leaving them at a login form they have just proved
 * they can pass.
 */
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [status, setStatus] = useState<"working" | "done" | "failed">("working");
  const [message, setMessage] = useState("");
  // React 18 mounts effects twice in development. Without this guard the token
  // would be redeemed twice on every local run.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setStatus("failed");
      setMessage(
        "This link is missing its verification code. Open the link from the email directly.",
      );
      return;
    }

    authApi
      .verifyEmail(token)
      .then((data) => {
        saveSession(data.access_token);
        setStatus("done");
        // A short pause so the confirmation is actually seen before the
        // dashboard replaces it.
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      })
      .catch((err) => {
        setStatus("failed");
        setMessage(errorMessage(err, "We could not verify this link."));
      });
  }, [token, navigate]);

  const heading =
    status === "working"
      ? "Verifying your email"
      : status === "done"
        ? "Email verified"
        : "This link did not work";

  return (
    <AuthLayout title={heading}>
      <div>
        {status === "working" && (
          <>
            <p className="flex items-center gap-2.5 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin text-accent-600" aria-hidden="true" />
              This only takes a moment.
            </p>
          </>
        )}

        {status === "done" && (
          <>
            <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-600">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-success-600"
                aria-hidden="true"
              />
              Your account is active. Taking you to your dashboard…
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-600">
              <MailWarning
                className="mt-0.5 h-4 w-4 shrink-0 text-danger-600"
                aria-hidden="true"
              />
              {message}
            </p>
            <Link
              to="/login"
              className="btn-primary mt-6 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-semibold transition-colors"
            >
              Back to sign in
            </Link>
            <p className="mt-3 text-xs text-ink-500">
              Signing in with an unverified account offers to send a fresh link.
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default VerifyEmailPage;
