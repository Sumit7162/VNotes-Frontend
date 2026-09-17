import axios from "axios";
import api from "./api";
import type { User } from "../types";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface MessageResponse {
  message: string;
  email_sent: boolean;
}

export const authApi = {
  getMe: async (): Promise<User> => {
    const response = await api.get("/api/auth/me");
    return response.data;
  },

  /** Create an account. No token comes back - the emailed link activates it. */
  signup: async (payload: {
    email: string;
    password: string;
    full_name?: string;
  }): Promise<MessageResponse> => {
    const response = await api.post("/api/auth/signup", payload);
    return response.data;
  },

  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/login", payload);
    return response.data;
  },

  /** Exchange the token from the emailed link for a session. */
  verifyEmail: async (token: string): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/verify-email", { token });
    return response.data;
  },

  resendVerification: async (email: string): Promise<MessageResponse> => {
    const response = await api.post("/api/auth/resend-verification", { email });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<MessageResponse> => {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string): Promise<AuthResponse> => {
    const response = await api.post("/api/auth/reset-password", { token, password });
    return response.data;
  },
};

/** Store a session token and let useAuth know it changed. */
export function saveSession(accessToken: string) {
  localStorage.setItem("token", accessToken);
  // useAuth listens for "storage", which the browser only fires in OTHER tabs.
  window.dispatchEvent(new Event("storage"));
}

/**
 * Pull the readable message out of an API error.
 *
 * FastAPI returns a plain string in `detail` for a raised HTTPException but an
 * array of field errors for a validation failure, and the password rules come
 * back through the second of those - so both shapes have to be handled or the
 * user sees "[object Object]".
 */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first?.msg === "string") {
        // Pydantic prefixes its messages with "Value error, ".
        return first.msg.replace(/^Value error,\s*/i, "");
      }
    }
    if (!err.response) return "Could not reach the server. Check your connection and try again.";
  }
  return fallback;
}

/** True when login failed only because the address is not verified yet. */
export function isUnverifiedError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 403;
}
