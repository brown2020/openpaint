import { createSolidFill, createTransform } from "@/types/vector";
import type { RectangleObject } from "@/types/vector";
import { describe, expect, it } from "vitest";
import { localToWorld } from "./bounds";
import { hitTestSelectionHandle, worldSelectionHandles } from "./selectionHandles";

function rotatedRect(): RectangleObject {
  return {
    id: "r",
    type: "rectangle",
    name: "Box",
    transform: { ...createTransform(100, 50), rotation: 45 },
    fill: createSolidFill("#000000"),
    stroke: null,
    opacity: 1,
    visible: true,
    locked: false,
    width: 40,
    height: 10,
    cornerRadius: [0, 0, 0, 0],
  };
}

describe("selection handles", () => {
  it("places handles on the rotated corners, not the axis-aligned box", () => {
    const obj = rotatedRect();
    const handles = worldSelectionHandles(obj);
    const topRight = handles.find((handle) => handle.id === "tr");
    const expected = localToWorld({ x: obj.width, y: 0 }, obj.transform);

    expect(topRight?.point.x).toBeCloseTo(expected.x);
    expect(topRight?.point.y).toBeCloseTo(expected.y);
    expect(topRight?.point.y).not.toBeCloseTo(50);
  });

  it("hits the transformed handle and misses the unrotated corner", () => {
    const obj = rotatedRect();
    const topRight = worldSelectionHandles(obj).find((handle) => handle.id === "tr");
    expect(topRight).toBeDefined();

    expect(hitTestSelectionHandle(topRight!.point, [obj])).toBe("tr");
    expect(hitTestSelectionHandle({ x: 140, y: 50 }, [obj])).toBeNull();
  });
});
