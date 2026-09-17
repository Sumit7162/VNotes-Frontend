import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Button, Input, Label, PasswordInput } from "@/components/ui/auth-fuse";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authApi, errorMessage, isUnverifiedError, saveSession } from "@/services/auth";

type Mode = "signin" | "signup" | "forgot";

const copy: Record<Mode, { title: string; subtitle: string; submit: string }> = {
  signin: {
    title: "Sign in to V-Notes AI",
    subtitle: "Use your email and password, or continue with Google.",
    submit: "Sign in",
  },
  signup: {
    title: "Create your account",
    subtitle: "Sign up with your email address, or continue with Google.",
    submit: "Create account",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "Enter your email address and we will send you a reset link.",
    submit: "Send reset link",
  },
};

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  // Shown instead of the form once signup succeeds: at that point the next
  // step is in their inbox, not on this page.
  const [sentTo, setSentTo] = useState("");
  const [busy, setBusy] = useState(false);
  // Set when login was refused only because the address is unverified, which
  // is the one case where offering to resend the link is useful.
  const [needsVerification, setNeedsVerification] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setNeedsVerification(false);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const { credential } = credentialResponse;
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await axios.post(`${apiBase}/api/auth/google`, { credential });
      saveSession(response.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failed", err);
      setError(errorMessage(err, "Failed to authenticate with the server. Please try again."));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setNeedsVerification(false);
    setBusy(true);

    try {
      if (mode === "signin") {
        const data = await authApi.login({ email: email.trim(), password });
        saveSession(data.access_token);
        navigate("/dashboard");
        return;
      }

      if (mode === "signup") {
        const data = await authApi.signup({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
        });
        if (data.email_sent) {
          setSentTo(email.trim());
        } else {
          // Either the account already existed under Google, or Brevo could
          // not deliver. Both cases have a real message worth showing.
          setNotice(data.message);
        }
        return;
      }

      const data = await authApi.forgotPassword(email.trim());
      setNotice(data.message);
    } catch (err) {
      if (mode === "signin" && isUnverifiedError(err)) {
        setNeedsVerification(true);
      }
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    setError("");
    try {
      const data = await authApi.resendVerification(email.trim());
      setNotice(data.message);
      setNeedsVerification(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // ---- Post-signup panel --------------------------------------------------
  if (sentTo) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle="Your account is created but not active yet."
      >
        <div className="surface-card p-6 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
            <MailCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            We sent a verification link to{" "}
            <span className="font-medium text-ink-900">{sentTo}</span>. Open it to activate
            your account — the link works for 24 hours.
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={busy}
            className="mt-5 w-full"
            onClick={() => {
              setEmail(sentTo);
              handleResend();
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Resend the email
          </Button>

          {notice && <p className="mt-3 text-xs text-ink-500">{notice}</p>}
        </div>

        <button
          type="button"
          onClick={() => {
            setSentTo("");
            switchMode("signin");
          }}
          className="mt-5 w-full text-sm text-ink-500 underline-offset-4 transition-colors hover:text-ink-900 hover:underline"
        >
          Back to sign in
        </button>
      </AuthLayout>
    );
  }

  const { title, subtitle, submit } = copy[mode];

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footer={
        <div className="space-y-3">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700"
            >
              <p>{error}</p>
              {needsVerification && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResend}
                  className="mt-1.5 text-xs font-semibold underline underline-offset-4 disabled:opacity-60"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}
          {notice && (
            <p className="rounded-lg border border-line bg-paper-200 px-3.5 py-2.5 text-sm text-ink-700">
              {notice}
            </p>
          )}
        </div>
      }
    >
      <form onSubmit={handleSubmit} autoComplete="on" className="grid gap-4">
        {mode === "signup" && (
          <div className="grid gap-1.5">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              name="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode !== "forgot" && (
          <PasswordInput
            name="password"
            label="Password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}

        {mode === "signup" && (
          <p className="-mt-1.5 text-xs text-ink-500">
            At least 8 characters, including a letter and a number.
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {submit}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-1 text-sm text-ink-500">
          {mode === "signin" ? (
            <>
              <button
                type="button"
                className="font-medium text-ink-700 underline-offset-4 hover:underline"
                onClick={() => switchMode("signup")}
              >
                Create an account
              </button>
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                onClick={() => switchMode("forgot")}
              >
                Forgot password?
              </button>
            </>
          ) : (
            <button
              type="button"
              className="font-medium text-ink-700 underline-offset-4 hover:underline"
              onClick={() => switchMode("signin")}
            >
              ← Back to sign in
            </button>
          )}
        </div>
      </form>

      <div className="relative my-6 text-center text-xs">
        <span className="absolute inset-x-0 top-1/2 border-t border-line" aria-hidden="true" />
        <span className="relative bg-paper-100 px-3 text-ink-400">Or continue with</span>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError("Google Sign-In was unsuccessful.")}
          useOneTap
          theme="filled_black"
          shape="pill"
          size="large"
          text="continue_with"
          width="320"
        />
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
