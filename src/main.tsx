import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function Root() {
  if (!googleClientId) {
    return (
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-dvh flex items-center justify-center bg-paper-100 px-4">
            <div className="text-center max-w-md p-8 rounded-3xl border border-line bg-paper-50 shadow-lg">
              <h1 className="font-display text-2xl font-semibold text-ink-900 tracking-tight mb-4">V-Notes AI</h1>
              <p className="text-ink-600 mb-4">
                Google Client ID is not configured. To run this app:
              </p>
              <ol className="text-left text-sm text-ink-500 space-y-2 list-decimal pl-5">
                <li>Create an OAuth Client ID at <code className="bg-paper-200 px-1 rounded">console.cloud.google.com</code></li>
                <li>Copy your Client ID</li>
                <li>Create <code className="bg-paper-200 px-1 rounded">frontend/.env</code> with:
                  <br />
                  <code className="bg-paper-200 px-2 py-1 block mt-1 rounded text-xs">
                    VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
                  </code>
                </li>
                <li>Restart the dev server</li>
              </ol>
            </div>
          </div>
        </QueryClientProvider>
      </React.StrictMode>
    );
  }

  return (
    <React.StrictMode>
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);
