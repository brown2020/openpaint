"use client";

import { useState } from "react";

interface EmailLinkPromptProps {
  onSubmit: (email: string) => void;
  onCancel: () => void;
}

/**
 * Asks for the address that requested an email sign-in link.
 * Shown when this browser has no stored email, without stripping the link first.
 */
export function EmailLinkPrompt({ onSubmit, onCancel }: EmailLinkPromptProps) {
  const [email, setEmail] = useState("");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-lg"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = email.trim();
          if (!trimmed) return;
          onSubmit(trimmed);
        }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Confirm your email</h2>
        <p className="text-sm text-gray-600">
          Enter the email address that requested this sign-in link.
        </p>
        <div>
          <label
            htmlFor="email-link-confirm"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email-link-confirm"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-lg bg-blue-800 px-4 py-2 text-white hover:bg-blue-900"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}
