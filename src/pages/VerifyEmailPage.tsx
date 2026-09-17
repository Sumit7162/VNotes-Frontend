import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/auth-fuse";
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
      setMessage("This link is missing its verification code. Open the link from the email directly.");
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper-50 p-8 text-center shadow-lg">
        <img
          src="/logo-tile.png"
          alt=""
          width={48}
          height={48}
          className="mx-auto mb-5 h-12 w-12 rounded-xl ring-1 ring-border"
        />

        {status === "working" && (
          <>
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <h1 className="font-display text-xl font-semibold text-ink-800">
              Verifying your email…
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">This only takes a moment.</p>
          </>
        )}

        {status === "done" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
            <h1 className="font-display text-xl font-semibold text-ink-800">Email verified</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is active. Taking you to your dashboard…
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <MailWarning className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="font-display text-xl font-semibold text-ink-800">
              This link did not work
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login">Back to sign in</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Signing in with an unverified account offers to send a fresh link.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
