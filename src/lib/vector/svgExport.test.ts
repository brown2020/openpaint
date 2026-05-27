import { describe, expect, it } from "vitest";
import {
  createLayer,
  createSolidFill,
  createStroke,
  createTransform,
} from "@/types/vector";
import type { LinearGradientFill, RectangleObject, TextObject } from "@/types/vector";
import {
  escapeXml,
  exportDocumentToSvg,
  pathSegmentsToD,
  roundedRectPathD,
} from "./svgExport";

describe("svgExport", () => {
  it("escapes XML special characters", () => {
    expect(escapeXml(`a & b <c> "d"`)).toBe("a &amp; b &lt;c&gt; &quot;d&quot;");
  });

  it("builds path d from segments", () => {
    const d = pathSegmentsToD([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 10, y: 10 },
      { type: "Z" },
    ]);
    expect(d).toBe("M 0 0 L 10 10 Z");
  });

  it("exports rectangle and text with transforms", () => {
    const rect: RectangleObject = {
      id: "r1",
      type: "rectangle",
      name: "Box",
      transform: createTransform(5, 10),
      fill: createSolidFill("#ff0000", 1),
      stroke: createStroke("#000000", 2),
      opacity: 1,
      visible: true,
      locked: false,
      width: 100,
      height: 50,
      cornerRadius: [0, 0, 0, 0],
    };
    const text: TextObject = {
      id: "t1",
      type: "text",
      name: "Label",
      transform: createTransform(0, 0),
      fill: createSolidFill("#000000", 1),
      stroke: null,
      opacity: 1,
      visible: true,
      locked: false,
      content: "Hi",
      fontFamily: "Arial",
      fontSize: 16,
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "left",
      lineHeight: 1.2,
    };

    const layer = createLayer("layer-1", "Layer 1");
    layer.objects = [rect, text];

    const svg = exportDocumentToSvg([layer], { width: 200, height: 100 });

    expect(svg).toContain('width="200"');
    expect(svg).toContain("<rect");
    expect(svg).toContain('translate(5,10)');
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain("<text");
    expect(svg).toContain("Hi</text>");
  });

  it("exports per-corner rounded rectangle as path", () => {
    const d = roundedRectPathD(100, 50, [10, 5, 0, 15]);
    expect(d).toContain("A 10 10");
    expect(d).toContain("A 5 5");
    expect(d).toContain("A 15 15");
    expect(d.endsWith("Z")).toBe(true);
  });

  it("exports linear gradient fills in defs", () => {
    const gradient: LinearGradientFill = {
      type: "linear-gradient",
      stops: [
        { offset: 0, color: "#ff0000", opacity: 1 },
        { offset: 1, color: "#0000ff", opacity: 0.5 },
      ],
      startX: 0,
      startY: 0,
      endX: 100,
      endY: 0,
    };

    const rect: RectangleObject = {
      id: "r1",
      type: "rectangle",
      name: "Grad",
      transform: createTransform(0, 0),
      fill: gradient,
      stroke: null,
      opacity: 1,
      visible: true,
      locked: false,
      width: 80,
      height: 40,
      cornerRadius: [0, 0, 0, 0],
    };

    const layer = createLayer("layer-1", "Layer 1");
    layer.objects = [rect];

    const svg = exportDocumentToSvg([layer], { width: 200, height: 100 });

    expect(svg).toContain("<defs>");
    expect(svg).toContain("<linearGradient");
    expect(svg).toContain('fill="url(#op-gradient-1)"');
    expect(svg).toContain('stop-color="#ff0000"');
  });

  it("skips hidden layers and objects", () => {
    const layer = createLayer("layer-1", "Layer 1");
    layer.visible = false;
    const svg = exportDocumentToSvg([layer], { width: 100, height: 100 });
    expect(svg).not.toContain("<rect");
    expect(svg).not.toContain("<path");
  });
});
