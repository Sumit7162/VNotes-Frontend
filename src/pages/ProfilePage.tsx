
import { useUsage } from "../hooks/useUsage";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { User, Mail, Calendar, ArrowLeft, Infinity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProfilePage() {
  const { user: dbUser, isLoadingUser, isLoaded } = useAuth();
  const { data: usageData, isLoading: usageLoading } = useUsage();

  if (!isLoaded || isLoadingUser || usageLoading) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  const displayName = dbUser?.full_name || "User";
  const displayEmail = dbUser?.email || "No email";
  const avatarUrl = dbUser?.avatar_url;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h2 className="font-display text-2xl font-semibold text-ink-900 tracking-tight">Profile</h2>
        <p className="text-sm text-ink-500 mt-1">Your account information</p>
      </div>

      <div className="bg-paper-50 rounded-xl border border-line p-5 sm:p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-accent-50 rounded-full flex items-center justify-center overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-accent" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-ink-900">
              {displayName}
            </h3>
            <p className="break-all text-sm text-ink-500">{displayEmail}</p>
          </div>
        </div>

        <div className="border-t border-line pt-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
            <div className="min-w-0">
              <p className="text-xs text-ink-500">Email</p>
              <p className="break-all text-sm font-medium text-ink-900">{displayEmail}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
            <div>
              <p className="text-xs text-ink-500">Member Since</p>
              <p className="text-sm font-medium text-ink-900">
                {dbUser?.created_at
                  ? new Date(dbUser.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-paper-50 rounded-xl border border-line p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-ink-900 mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
          <div>
            <p className="text-xs text-ink-500 mb-1">Total Videos Processed</p>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">
              {usageData?.total_videos ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-500 mb-1">Today's Videos (15-30 min)</p>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">
              {usageData?.today?.videos_processed ?? 0} / {usageData?.today?.daily_limit ?? 2}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-500 mb-1">Minutes Used Today</p>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">
              {usageData?.today?.minutes_processed ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-500 mb-1">Remaining Today (15-30 min)</p>
            <p className="text-2xl font-semibold text-ink-900 tabular-nums">
              {usageData?.today?.remaining_videos ?? 0} videos
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-line">
          <Infinity className="h-4 w-4 text-success-600" />
          <p className="text-xs text-ink-500">
            Videos under 15 minutes are <span className="font-semibold text-success-600">unlimited</span>
          </p>
        </div>
      </div>
    </div>
  );
}
