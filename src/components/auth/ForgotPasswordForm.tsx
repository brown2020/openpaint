"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordReset, getAuthErrorMessage } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  useLinks?: boolean;
}

export function ForgotPasswordForm({
  onBackToLogin,
  useLinks = false,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { setError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setEmailSent(true);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setLocalError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const backControl = useLinks ? (
    <p className="text-center text-sm text-gray-600">
      <Link
        href="/login"
        className="text-blue-800 hover:text-blue-900 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        Back to Sign In
      </Link>
    </p>
  ) : onBackToLogin ? (
    <p className="text-center text-sm text-gray-600">
      <button
        type="button"
        onClick={onBackToLogin}
        className="text-blue-800 hover:text-blue-900 font-medium"
      >
        Back to Sign In
      </button>
    </p>
  ) : null;

  if (emailSent) {
    return (
      <div className="space-y-4">
        <div
          role="status"
          className="p-4 bg-green-50 border border-green-200 rounded-lg"
        >
          <h3 className="font-medium text-green-900 mb-1">Check your email</h3>
          <p className="text-sm text-green-900">
            We sent a password reset link to <strong>{email}</strong>. Click the
            link in the email to reset your password.
          </p>
        </div>

        <p className="text-center text-sm text-gray-600">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-blue-800 hover:text-blue-900 font-medium"
          >
            Try again
          </button>
        </p>

        {backControl}
      </div>
    );
  }

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

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-sm">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
      </div>

      <div>
        <label
          htmlFor="forgot-password-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="forgot-password-email"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <LoadingSpinner size="sm" />}
        Send Reset Link
      </button>

      {useLinks ? (
        <p className="text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            href="/login"
            className="text-blue-800 hover:text-blue-900 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            Back to Sign In
          </Link>
        </p>
      ) : onBackToLogin ? (
        <p className="text-center text-sm text-gray-600">
          Remember your password?{" "}
          <button
            type="button"
            onClick={onBackToLogin}
            className="text-blue-800 hover:text-blue-900 font-medium"
          >
            Back to Sign In
          </button>
        </p>
      ) : null}
    </form>
  );
}
