import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { PasswordInput } from "@/components/ui/auth-fuse";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authApi, errorMessage, saveSession } from "@/services/auth";

/** Where the link in the password-reset email lands. */
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    // Checked here as well as by the second field's own value, because the two
    // fields are the only protection against a typo locking someone out.
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const data = await authApi.resetPassword(token, password);
      saveSession(data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Choose a new password">
        <div>
          <p className="text-sm leading-relaxed text-danger-700">
            This link is missing its reset code. Open the link from the email directly.
          </p>
          <Link
            to="/login"
            className="btn-primary mt-6 inline-flex h-10 w-full items-center justify-center rounded-md text-sm font-semibold transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="At least 8 characters, including a letter and a number."
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <PasswordInput
          name="password"
          label="New password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          name="confirm-password"
          label="Confirm new password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repeat the password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-danger-200 bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save new password
        </button>

        <Link
          to="/login"
          className="text-center text-sm text-ink-500 underline-offset-4 transition-colors hover:text-ink-900 hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}

export default ResetPasswordPage;
