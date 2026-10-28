import { describe, expect, it } from "vitest";
import {
  LOCAL_PROJECT_VERSION,
  buildLocalProjectSnapshot,
  localProjectFilename,
  serializeLocalProject,
} from "./localProjectFile";
import type { VectorLayer } from "@/types/vector";

const layer: VectorLayer = {
  id: "layer-1",
  name: "Layer 1",
  visible: true,
  locked: false,
  opacity: 1,
  objects: [],
};

describe("local project file", () => {
  it("builds a v2 snapshot the file opener can reload", () => {
    const now = new Date("2026-10-28T23:00:00.000Z");
    const snapshot = buildLocalProjectSnapshot({
      name: "  Logo  ",
      canvasSize: { width: 800, height: 600 },
      layers: [layer],
      now,
    });

    expect(snapshot).toEqual({
      version: LOCAL_PROJECT_VERSION,
      name: "Logo",
      createdAt: "2026-10-28T23:00:00.000Z",
      modifiedAt: "2026-10-28T23:00:00.000Z",
      canvasSize: { width: 800, height: 600 },
      layers: [layer],
    });

    const parsed = JSON.parse(serializeLocalProject(snapshot)) as {
      version?: string;
      layers?: VectorLayer[];
    };
    expect(parsed.version?.startsWith("2")).toBe(true);
    expect(parsed.layers?.[0]?.id).toBe("layer-1");
  });

  it("falls back to Untitled when the name is blank", () => {
    const snapshot = buildLocalProjectSnapshot({
      name: "   ",
      canvasSize: { width: 1, height: 1 },
      layers: [layer],
      now: new Date(0),
    });
    expect(snapshot.name).toBe("Untitled");
  });

  it("sanitizes the download filename", () => {
    expect(localProjectFilename("My Logo")).toBe("My Logo.json");
    expect(localProjectFilename('a/b:c*?"<>|.json')).toBe("a-b-c------.json");
    expect(localProjectFilename("   ")).toBe("openpaint-project.json");
  });
});
