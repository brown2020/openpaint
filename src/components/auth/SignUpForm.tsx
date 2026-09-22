"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpWithEmail, getAuthErrorMessage } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { PasswordField } from "./PasswordField";
import { waitForSignedInUser } from "@/lib/auth/waitForSession";

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  useLinks?: boolean;
  redirectTo?: string;
}

/**
 * Email/password signup form
 */
export function SignUpForm({
  onSuccess,
  onSwitchToLogin,
  useLinks = false,
  redirectTo,
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { setError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await signUpWithEmail(email, password);
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
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
        >
          {localError}
        </div>
      )}

      <div>
        <label
          htmlFor="signup-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="signup-email"
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
        id="signup-password"
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={6}
        placeholder="At least 6 characters"
      />

      <PasswordField
        id="signup-confirm-password"
        label="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={6}
        placeholder="Confirm your password"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <LoadingSpinner size="sm" />}
        Create Account
      </button>

      {useLinks ? (
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-500 hover:text-blue-600 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Sign in
          </Link>
        </p>
      ) : onSwitchToLogin ? (
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Sign in
          </button>
        </p>
      ) : null}
    </form>
  );
}
