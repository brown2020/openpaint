import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./auth";

function authError(code: string, message: string): Error {
  const error = new Error(message);
  (error as Error & { code: string }).code = code;
  return error;
}

describe("getAuthErrorMessage", () => {
  it("does not reveal whether an email is registered", () => {
    const generic = "Invalid email or password. Please try again.";
    expect(getAuthErrorMessage(authError("auth/user-not-found", "no user"))).toBe(
      generic,
    );
    expect(getAuthErrorMessage(authError("auth/wrong-password", "bad password"))).toBe(
      generic,
    );
    expect(
      getAuthErrorMessage(authError("auth/invalid-credential", "invalid")),
    ).toBe(generic);
  });
});
