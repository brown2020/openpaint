import { describe, expect, it } from "vitest";
import { createTransform, createSolidFill } from "@/types/vector";
import type { RectangleObject, TextObject } from "@/types/vector";
import { formatObjectListLabel } from "./objectLabel";

describe("formatObjectListLabel", () => {
  it("combines type and truncated name", () => {
    const rect: RectangleObject = {
      id: "1",
      type: "rectangle",
      name: "Hero box",
      transform: createTransform(0, 0),
      fill: createSolidFill("#000", 1),
      stroke: null,
      opacity: 1,
      visible: true,
      locked: false,
      width: 10,
      height: 10,
      cornerRadius: [0, 0, 0, 0],
    };
    expect(formatObjectListLabel(rect)).toBe("Rectangle · Hero box");
  });

  it("uses text content when name is empty", () => {
    const text: TextObject = {
      id: "2",
      type: "text",
      name: "Text",
      transform: createTransform(0, 0),
      fill: createSolidFill("#000", 1),
      stroke: null,
      opacity: 1,
      visible: true,
      locked: false,
      content: "Hello world",
      fontFamily: "sans-serif",
      fontSize: 16,
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "left",
      lineHeight: 1.2,
    };
    expect(formatObjectListLabel(text)).toBe("Text · Hello world");
  });
});
