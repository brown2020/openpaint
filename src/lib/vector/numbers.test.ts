import { describe, expect, it } from "vitest";
import { clampNumber, nonNegativeRadius } from "./numbers";

describe("clampNumber", () => {
  it("clamps to min and max", () => {
    expect(clampNumber(-4, 1, 12)).toBe(1);
    expect(clampNumber(40, 1, 12)).toBe(12);
    expect(clampNumber(6, 1, 12)).toBe(6);
  });

  it("replaces non-finite values with min or zero", () => {
    expect(clampNumber(Number.NaN, 1)).toBe(1);
    expect(clampNumber(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("nonNegativeRadius", () => {
  it("rejects negative and non-finite radii", () => {
    expect(nonNegativeRadius(-5)).toBe(0);
    expect(nonNegativeRadius(Number.NaN)).toBe(0);
    expect(nonNegativeRadius("nope")).toBe(0);
  });

  it("keeps zero and positive radii", () => {
    expect(nonNegativeRadius(0)).toBe(0);
    expect(nonNegativeRadius(12.5)).toBe(12.5);
  });
});
