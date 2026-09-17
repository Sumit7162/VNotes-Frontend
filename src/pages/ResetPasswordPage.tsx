import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";
import { Button, PasswordInput } from "@/components/ui/auth-fuse";
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-paper-50 p-8 shadow-lg">
        <div className="mb-6 text-center">
          <KeyRound className="mx-auto mb-4 h-9 w-9 text-primary" aria-hidden="true" />
          <h1 className="font-display text-xl font-semibold text-ink-800">Choose a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            At least 8 characters, including a letter and a number.
          </p>
        </div>

        {!token ? (
          <div className="grid gap-4 text-center">
            <p className="text-sm text-destructive">
              This link is missing its reset code. Open the link from the email directly.
            </p>
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </div>
        ) : (
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
                className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Save new password
            </Button>

            <Link
              to="/login"
              className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
