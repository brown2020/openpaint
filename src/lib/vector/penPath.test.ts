import { describe, expect, it } from "vitest";
import {
  penAnchorsToSegments,
  mirroredHandle,
  pathOriginFromAnchors,
} from "./penPath";

describe("penPath", () => {
  it("mirrors a handle across the anchor", () => {
    expect(mirroredHandle({ x: 10, y: 10 }, { x: 20, y: 10 })).toEqual({
      x: 0,
      y: 10,
    });
  });

  it("builds line segments for corner anchors", () => {
    const anchors = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
    ];
    const origin = pathOriginFromAnchors(anchors);
    const segments = penAnchorsToSegments(anchors, origin, false);
    expect(segments).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 50, y: 0 },
      { type: "L", x: 50, y: 50 },
    ]);
  });

  it("builds cubic segments when handles are present", () => {
    const anchors = [
      { x: 0, y: 0, outHandle: { x: 20, y: 0 } },
      { x: 40, y: 0, inHandle: { x: 20, y: 0 } },
    ];
    const origin = pathOriginFromAnchors(anchors);
    const segments = penAnchorsToSegments(anchors, origin, false);
    expect(segments[1]).toMatchObject({ type: "C", x: 40, y: 0 });
  });

  it("closes with Z", () => {
    const anchors = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    const origin = pathOriginFromAnchors(anchors);
    const segments = penAnchorsToSegments(anchors, origin, true);
    expect(segments[segments.length - 1]).toEqual({ type: "Z" });
  });
});
