import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS, securityHeaderRoutes } from "./securityHeaders";

const repoRoot = resolve(__dirname, "../../..");

describe("security headers", () => {
  it("sets CSP, frame denial, and a referrer policy on every route", () => {
    const routes = securityHeaderRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0]?.source).toBe("/:path*");
    const keys = routes[0]?.headers.map((header) => header.key);
    expect(keys).toEqual([
      "Content-Security-Policy",
      "X-Frame-Options",
      "Referrer-Policy",
    ]);
    const csp = SECURITY_HEADERS[0]?.value ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://*.googleapis.com");
    expect(SECURITY_HEADERS[1]?.value).toBe("DENY");
    expect(SECURITY_HEADERS[2]?.value).toBe("strict-origin-when-cross-origin");
  });

  it("is wired from next.config.ts", () => {
    const source = readFileSync(resolve(repoRoot, "next.config.ts"), "utf8");
    expect(source).toContain("securityHeaderRoutes");
  });
});
