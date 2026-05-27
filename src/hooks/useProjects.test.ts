import { describe, expect, it } from "vitest";

/**
 * Client-side guard mirrored in loadProject — Firestore rules are the
 * authoritative server-side check for cross-user access.
 */
function canAccessProject(
  projectUserId: string | undefined,
  authUid: string,
): boolean {
  return Boolean(projectUserId && projectUserId === authUid);
}

describe("project access guard", () => {
  it("allows access when userId matches auth uid", () => {
    expect(canAccessProject("user-a", "user-a")).toBe(true);
  });

  it("denies access when userId differs", () => {
    expect(canAccessProject("user-a", "user-b")).toBe(false);
  });

  it("denies access when project userId is missing", () => {
    expect(canAccessProject(undefined, "user-a")).toBe(false);
  });
});
