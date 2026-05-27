import { describe, expect, it } from "vitest";
import {
  boundsIntersect,
  getLocalBounds,
  mergeBounds,
  pointInBounds,
} from "./bounds";
import { createTransform, type RectangleObject } from "@/types/vector";

function makeRect(
  width: number,
  height: number,
): RectangleObject {
  return {
    id: "r1",
    type: "rectangle",
    name: "Rect",
    transform: createTransform(10, 20),
    fill: null,
    stroke: null,
    opacity: 1,
    visible: true,
    locked: false,
    width,
    height,
    cornerRadius: [0, 0, 0, 0],
  };
}

describe("bounds utilities", () => {
  it("computes local bounds for rectangles", () => {
    expect(getLocalBounds(makeRect(100, 50))).toEqual({
      x: 0,
      y: 0,
      width: 100,
      height: 50,
    });
  });

  it("merges bounding boxes", () => {
    expect(
      mergeBounds([
        { x: 0, y: 0, width: 10, height: 10 },
        { x: 5, y: 8, width: 20, height: 4 },
      ]),
    ).toEqual({ x: 0, y: 0, width: 25, height: 12 });
  });

  it("detects point inside bounds", () => {
    const box = { x: 10, y: 10, width: 20, height: 20 };
    expect(pointInBounds({ x: 15, y: 15 }, box)).toBe(true);
    expect(pointInBounds({ x: 0, y: 0 }, box)).toBe(false);
  });

  it("detects intersecting bounds", () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    const c = { x: 20, y: 20, width: 5, height: 5 };
    expect(boundsIntersect(a, b)).toBe(true);
    expect(boundsIntersect(a, c)).toBe(false);
  });
});
