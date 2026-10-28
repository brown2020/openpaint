import { describe, expect, it } from "vitest";
import { normalizeCanvasSize } from "./canvasSize";

describe("normalizeCanvasSize", () => {
  it("rounds fractional dimensions to integers", () => {
    expect(normalizeCanvasSize({ width: 800.5, height: 599.4 })).toEqual({
      width: 801,
      height: 599,
    });
  });

  it("leaves integer presets unchanged", () => {
    expect(normalizeCanvasSize({ width: 1920, height: 1080 })).toEqual({
      width: 1920,
      height: 1080,
    });
  });
});
