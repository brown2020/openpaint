"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmail, getAuthErrorMessage } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PasswordField } from "./PasswordField";
import { waitForSignedInUser } from "@/lib/auth/waitForSession";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
  onSwitchToEmailLink?: () => void;
  onSwitchToForgotPassword?: () => void;
  /** When true, use Next.js Links for account switches (dedicated auth routes). */
  useLinks?: boolean;
  /** After success, hard-navigate here once session is settled. */
  redirectTo?: string;
}

/**
 * Email/password login form
 */
export function LoginForm({
  onSuccess,
  onSwitchToSignUp,
  onSwitchToEmailLink,
  onSwitchToForgotPassword,
  useLinks = false,
  redirectTo,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { setError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      await waitForSignedInUser();
      if (redirectTo) {
        window.location.assign(redirectTo);
        return;
      }
      onSuccess?.();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setLocalError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {localError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
        >
          {localError}
        </div>
      )}

      <div>
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="you@example.com"
        />
      </div>

      <PasswordField
        id="login-password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
        placeholder="Enter your password"
      />

      <div className="-mt-2">
        {useLinks ? (
          <Link
            href="/forgot-password"
            className="text-sm text-blue-800 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Forgot password?
          </Link>
        ) : onSwitchToForgotPassword ? (
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-blue-800 hover:text-blue-900"
          >
            Forgot password?
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <LoadingSpinner size="sm" />}
        Sign In
      </button>

      <div className="text-center space-y-2">
        {onSwitchToEmailLink && (
          <button
            type="button"
            onClick={onSwitchToEmailLink}
            className="text-sm text-blue-800 hover:text-blue-900"
          >
            Sign in with email link instead
          </button>
        )}
        {useLinks ? (
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-800 hover:text-blue-900 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Sign up
            </Link>
          </p>
        ) : onSwitchToSignUp ? (
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignUp}
              className="text-blue-800 hover:text-blue-900 font-medium"
            >
              Sign up
            </button>
          </p>
        ) : null}
      </div>
    </form>
  );
}
