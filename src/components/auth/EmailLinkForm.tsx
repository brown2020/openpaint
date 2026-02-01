"use client";

import { useState } from "react";
import { sendSignInLink, getAuthErrorMessage } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface EmailLinkFormProps {
  onSwitchToPassword?: () => void;
}

/**
 * Passwordless email link sign-in form
 */
export function EmailLinkForm({ onSwitchToPassword }: EmailLinkFormProps) {
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
      await sendSignInLink(email);
      setEmailSent(true);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setLocalError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-800 mb-1">Check your email</h3>
          <p className="text-sm text-green-700">
            We sent a sign-in link to <strong>{email}</strong>. Click the link
            in the email to sign in.
          </p>
        </div>

        <p className="text-center text-sm text-gray-600">
          Didn&apos;t receive the email?{" "}
          <button
            type="button"
            onClick={() => setEmailSent(false)}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {localError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {localError}
        </div>
      )}

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
        Sign in without a password. We&apos;ll send you a magic link to your
        email.
      </div>

      <div>
        <label
          htmlFor="email-link-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="email-link-email"
          type="email"
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
        className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <LoadingSpinner size="sm" />}
        Send Sign-In Link
      </button>

      {onSwitchToPassword && (
        <p className="text-center text-sm text-gray-600">
          Prefer to use a password?{" "}
          <button
            type="button"
            onClick={onSwitchToPassword}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Sign in with password
          </button>
        </p>
      )}
    </form>
  );
}
