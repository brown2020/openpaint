import { describe, expect, it } from "vitest";
import {
  computeObjectReorder,
  uiIndexToArrayIndex,
} from "./layerObjectReorder";

describe("layerObjectReorder", () => {
  it("maps top UI row to last array index", () => {
    expect(uiIndexToArrayIndex(0, 3)).toBe(2);
    expect(uiIndexToArrayIndex(2, 3)).toBe(0);
  });

  it("computes reorder from bottom to top", () => {
    // objects [A, B, C] — UI: C(0), B(1), A(2)
    expect(computeObjectReorder(3, 0, 0)).toEqual({
      fromIndex: 0,
      toIndex: 2,
    });
  });

  it("returns null when indices match", () => {
    expect(computeObjectReorder(3, 1, 1)).toBeNull();
  });
});
