const DISMISS_KEY = "openpaint-guest-banner-dismissed";

export function getGuestBannerDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function setGuestBannerDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, "1");
}
