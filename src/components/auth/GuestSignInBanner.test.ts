import { beforeEach, describe, expect, it } from "vitest";
import {
  getGuestBannerDismissed,
  setGuestBannerDismissed,
} from "./guestBannerStorage";

describe("GuestSignInBanner persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts undismissed", () => {
    expect(getGuestBannerDismissed()).toBe(false);
  });

  it("remembers dismiss", () => {
    setGuestBannerDismissed();
    expect(getGuestBannerDismissed()).toBe(true);
  });
});
