import { describe, expect, it } from "vitest";
import { createLayer } from "@/types/vector";
import {
  projectNeedsLegacyRasterImport,
  buildEmptyVectorLayersFromMetadata,
} from "./legacyProjectImport";

describe("legacyProjectImport", () => {
  const meta = [
    {
      id: "l1",
      name: "Layer 1",
      visible: true,
      opacity: 1,
      locked: false,
      blendMode: "source-over" as const,
      storageRef: "users/u/projects/p/layers/l1.png",
    },
  ];

  it("detects legacy when vectorLayers missing", () => {
    expect(projectNeedsLegacyRasterImport(undefined, meta)).toBe(true);
  });

  it("detects legacy when all object lists are empty", () => {
    const emptyLayer = createLayer("l1", "Layer 1");
    expect(projectNeedsLegacyRasterImport([emptyLayer], meta)).toBe(true);
  });

  it("skips import when vector objects exist", () => {
    const layer = createLayer("l1", "Layer 1");
    layer.objects = [
      {
        id: "o1",
        type: "rectangle",
        name: "Box",
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 },
        fill: null,
        stroke: null,
        opacity: 1,
        visible: true,
        locked: false,
        width: 10,
        height: 10,
        cornerRadius: [0, 0, 0, 0],
      },
    ];
    expect(projectNeedsLegacyRasterImport([layer], meta)).toBe(false);
  });

  it("skips when no storage refs", () => {
    const metaNoStorage = [{ ...meta[0], storageRef: "" }];
    expect(projectNeedsLegacyRasterImport(undefined, metaNoStorage)).toBe(
      false,
    );
  });

  it("builds metadata-only layers", () => {
    const layers = buildEmptyVectorLayersFromMetadata(meta);
    expect(layers).toHaveLength(1);
    expect(layers[0].objects).toHaveLength(0);
    expect(layers[0].visible).toBe(true);
  });
});
