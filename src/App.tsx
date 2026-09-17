import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Header } from "./components/Header";
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

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // h-screen rather than min-h-screen: the shell has to be exactly the
    // viewport so that <main> is the only thing that scrolls. With min-h-screen
    // a long page grew the shell itself, so the whole document scrolled and
    // carried the header off the top with it.
    <div className="h-screen bg-paper-100 text-ink-800 flex flex-col overflow-hidden print:block print:h-auto print:overflow-visible print:min-h-0 print:bg-none">
      <Header />
      {/* min-h-0 lets this flex child shrink below its content height, which is
          what allows it to scroll instead of the page. */}
      <main className="flex-1 min-h-0 overflow-y-auto print:overflow-visible print:block px-3 pb-8 pt-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}

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
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <VideoSubmitPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotesListPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes/:videoId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <NotesViewerPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <AppLayout>
                <QuizDashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        {/* Declared before /quiz/:videoId so "attempt" is never mistaken for a
            video id. */}
        <Route
          path="/quiz/attempt/:attemptId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <QuizAttemptPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quiz/:videoId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <QuizPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
