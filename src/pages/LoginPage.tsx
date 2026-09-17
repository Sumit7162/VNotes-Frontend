import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { AuthUI, Button, Input, Label, PasswordInput } from "@/components/ui/auth-fuse";
import RecursiveErosionBackground from "@/components/ui/recursive-erosion";
import { authApi, errorMessage, isUnverifiedError, saveSession } from "@/services/auth";

type Mode = "signin" | "signup" | "forgot";

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

  const submitLabel =
    mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";

  const emailForm = sentTo ? (
    <div className="grid gap-4 text-center">
      <MailCheck className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        We sent a verification link to <span className="font-medium text-foreground">{sentTo}</span>.
        Open it to activate your account — the link works for 24 hours.
      </p>
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => {
          setEmail(sentTo);
          handleResend();
        }}
      >
        Resend the email
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={() => {
          setSentTo("");
          switchMode("signin");
        }}
      >
        Back to sign in
      </Button>
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
    </div>
  ) : (
    <form onSubmit={handleSubmit} autoComplete="on" className="grid gap-4">
      {mode === "signup" && (
        <div className="grid gap-2">
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

      <div className="grid gap-2">
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
        <p className="-mt-1 text-xs text-muted-foreground">
          At least 8 characters, including a letter and a number.
        </p>
      )}

      <Button type="submit" disabled={busy} className="mt-1">
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {submitLabel}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-1 text-sm text-muted-foreground">
        {mode === "signin" ? (
          <>
            <button
              type="button"
              className="text-foreground underline-offset-4 hover:underline"
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
            className="text-foreground underline-offset-4 hover:underline"
            onClick={() => switchMode("signin")}
          >
            ← Back to sign in
          </button>
        )}
      </div>
    </form>
  );

  return (
    <AuthUI
      hideAside
      mode={mode === "signup" ? "signup" : "signin"}
      // Held back below `sm`, where the card drops its own background and dark
      // form text would sit straight on the black ground. From sm up the card
      // is 90% white, so the form reads cleanly over the effect.
      formBackgroundSlot={
        <div className="hidden h-full w-full sm:block">
          <RecursiveErosionBackground mode="dark" />
        </div>
      }
      formPanelClassName="login-surface login-surface-night"
      // The card only gains its padding from sm up, where 520px minus p-8
      // still clears the Google button. On a phone it drops the chrome and
      // uses the full width instead of clipping.
      formCardClassName="w-full max-w-[520px] sm:rounded-2xl sm:border sm:border-line sm:bg-paper-50/90 sm:p-8 sm:shadow-lg"
      title="Sign in to V-Notes AI"
      signUpTitle={mode === "forgot" ? "Reset your password" : "Create your account"}
      subtitle={
        mode === "forgot"
          ? "Enter your email address and we will send you a reset link."
          : mode === "signup"
            ? "Sign up with your email address, or continue with Google."
            : "Use your email and password, or continue with Google."
      }
      brand={
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo-tile.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 rounded-2xl ring-1 ring-border"
          />
        </div>
      }
      emailFormSlot={emailForm}
      googleSlot={
        sentTo ? null : (
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google Sign-In was unsuccessful.")}
            useOneTap
            theme="filled_black"
            shape="pill"
            size="large"
            text="continue_with"
            width="400"
          />
        )
      }
      footer={
        <div className="grid gap-3 text-center">
          {error && (
            <div
              role="alert"
              className="grid gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <p>{error}</p>
              {needsVerification && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleResend}
                  className="justify-self-center text-xs font-medium underline underline-offset-4 disabled:opacity-60"
                >
                  Resend verification email
                </button>
              )}
            </div>
          )}
          {notice && !sentTo && (
            <p className="rounded-lg border border-line bg-paper-100/80 px-3 py-2 text-sm text-ink-700">
              {notice}
            </p>
          )}
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      }
    />
  );
}

export default LoginPage;
