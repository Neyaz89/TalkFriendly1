/**
 * Authentication service.
 * All auth API calls go through this file.
 * Mocked to simulate a FastAPI backend response.
 */

import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ForgotPasswordPayload,
  OtpVerifyPayload,
} from "@/types";
import { MOCK_AUTH_USER } from "@/mocks/users.mock";
import { delay } from "@/lib/utils";
import { STORAGE_KEYS } from "@/constants";

const MOCK_DELAY = 800; // Simulate realistic network latency

export const authService = {
  /**
   * POST /auth/login
   * Authenticates user and returns JWT tokens.
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(MOCK_DELAY);

    // Simulate wrong credentials
    if (credentials.password === "wrong") {
      throw new Error("Invalid email or password. Please try again.");
    }

    const response: AuthResponse = {
      user: MOCK_AUTH_USER,
      accessToken: "mock_access_token_" + Date.now(),
      refreshToken: "mock_refresh_token_" + Date.now(),
      expiresIn: 3600,
    };

    // Persist to localStorage (simulating what a real auth would do)
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

    if (credentials.rememberMe) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
    }

    return response;
  },

  /**
   * POST /auth/register
   * Creates a new user account.
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    await delay(MOCK_DELAY);

    const user = {
      ...MOCK_AUTH_USER,
      name: credentials.name,
      email: credentials.email,
      isVerified: false,
    };

    const response: AuthResponse = {
      user,
      accessToken: "mock_access_token_" + Date.now(),
      refreshToken: "mock_refresh_token_" + Date.now(),
      expiresIn: 3600,
    };

    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));

    return response;
  },

  /**
   * POST /auth/forgot-password
   * Sends a password reset email.
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
    await delay(MOCK_DELAY);
    return { message: `Password reset link sent to ${payload.email}` };
  },

  /**
   * POST /auth/verify-otp
   * Verifies the OTP code sent to the user's email.
   */
  async verifyOtp(payload: OtpVerifyPayload): Promise<{ verified: boolean }> {
    await delay(MOCK_DELAY);

    // Mock: any 6-digit code works in development
    if (payload.otp.length !== 6) {
      throw new Error("Invalid OTP. Please enter the 6-digit code.");
    }

    return { verified: true };
  },

  /**
   * POST /auth/logout
   * Clears local auth state.
   */
  async logout(): Promise<void> {
    await delay(300);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Checks if a user is currently authenticated.
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Returns the currently stored user without an API call.
   */
  getCurrentUser() {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },
};
