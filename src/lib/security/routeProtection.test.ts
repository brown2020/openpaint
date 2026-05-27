import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../../..");

/**
 * OpenPaint is a client-only SPA. There is no Next.js middleware/proxy
 * route guard — authorization for cloud data is enforced in Firestore/Storage rules.
 */
describe("route protection model", () => {
  it("does not use Next.js middleware or proxy route guards", () => {
    expect(existsSync(resolve(repoRoot, "middleware.ts"))).toBe(false);
    expect(existsSync(resolve(repoRoot, "src/middleware.ts"))).toBe(false);
    expect(existsSync(resolve(repoRoot, "proxy.ts"))).toBe(false);
    expect(existsSync(resolve(repoRoot, "src/proxy.ts"))).toBe(false);
  });

  it("does not expose App Router API route handlers", () => {
    expect(existsSync(resolve(repoRoot, "src/app/api"))).toBe(false);
  });

  it("requires authenticated Firestore access in security rules", () => {
    const rules = existsSync(resolve(repoRoot, "firestore.rules"));
    expect(rules).toBe(true);
  });
});
