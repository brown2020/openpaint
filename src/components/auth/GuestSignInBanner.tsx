"use client";

const DISMISS_KEY = "openpaint-guest-banner-dismissed";

interface GuestSignInBannerProps {
  onSignIn: () => void;
  onOpenCloudProjects: () => void;
  dismissed: boolean;
  onDismiss: () => void;
}

export function getGuestBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function setGuestBannerDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, "1");
}

/**
 * Non-blocking prompt for guests to sign in for cloud features.
 */
export function GuestSignInBanner({
  onSignIn,
  onOpenCloudProjects,
  dismissed,
  onDismiss,
}: GuestSignInBannerProps) {
  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cloud save notice"
      className="flex flex-wrap items-center justify-center gap-2 px-4 py-2 bg-blue-50 border-b border-blue-200 text-sm text-blue-900"
    >
      <span>Sign in to save projects to the cloud and open them from any device.</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSignIn}
          className="px-3 py-1 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={onOpenCloudProjects}
          className="px-3 py-1 rounded-md border border-blue-300 text-blue-800 font-medium hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
        >
          Cloud projects
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-2 py-1 rounded-md text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Dismiss sign-in banner"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
