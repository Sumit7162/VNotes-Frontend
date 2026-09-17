import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { HomePage } from "./pages/HomePage";

import { DashboardPage } from "./pages/DashboardPage";
import { VideoSubmitPage } from "./pages/VideoSubmitPage";
import { NotesListPage } from "./pages/NotesListPage";
import { NotesViewerPage } from "./pages/NotesViewerPage";
import { QuizPage } from "./pages/QuizPage";
import { QuizDashboardPage } from "./pages/QuizDashboardPage";
import { QuizAttemptPage } from "./pages/QuizAttemptPage";
import { ProfilePage } from "./pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Where the links in the Brevo emails land. Both are public: whoever
            follows one is not signed in yet - following it is what signs them
            in. */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit"
          element={
            <ProtectedRoute>
              <AppShell>
                <VideoSubmitPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <AppShell>
                <NotesListPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/:videoId"
          element={
            <ProtectedRoute>
              <AppShell>
                <NotesViewerPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <AppShell>
                <QuizDashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        {/* Declared before /quiz/:videoId so "attempt" is never mistaken for a
            video id. */}
        <Route
          path="/quiz/attempt/:attemptId"
          element={
            <ProtectedRoute>
              <AppShell>
                <QuizAttemptPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:videoId"
          element={
            <ProtectedRoute>
              <AppShell>
                <QuizPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
