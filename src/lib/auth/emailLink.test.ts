import { describe, expect, it } from "vitest";
import { resolveEmailLinkSignIn } from "./emailLink";

describe("resolveEmailLinkSignIn", () => {
  it("ignores ordinary URLs", () => {
    expect(resolveEmailLinkSignIn(false, null)).toBe("ignore");
    expect(resolveEmailLinkSignIn(false, "a@example.com")).toBe("ignore");
  });

  it("prompts instead of discarding a link that has no stored email", () => {
    expect(resolveEmailLinkSignIn(true, null)).toBe("prompt");
    expect(resolveEmailLinkSignIn(true, "")).toBe("prompt");
  });

  it("completes when the address is already stored on this device", () => {
    expect(resolveEmailLinkSignIn(true, "a@example.com")).toBe("complete");
  });
});
