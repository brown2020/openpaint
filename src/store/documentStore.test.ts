import { beforeEach, describe, expect, it } from "vitest";
import { useProjectStore } from "@/store/projectStore";
import { createLayer, createSolidFill, createTransform } from "@/types/vector";
import type { RectangleObject, VectorLayer } from "@/types/vector";
import { useDocumentStore } from "./documentStore";

function rect(id: string): RectangleObject {
  return {
    id,
    type: "rectangle",
    name: id,
    transform: createTransform(),
    fill: createSolidFill("#000000"),
    stroke: null,
    opacity: 1,
    visible: true,
    locked: false,
    width: 10,
    height: 10,
    cornerRadius: [0, 0, 0, 0],
  };
}

function setLayer(objects: RectangleObject[]): VectorLayer {
  const layer = createLayer("layer-1", "Layer 1");
  layer.objects = objects;

  useDocumentStore.setState({
    layers: [layer],
    activeLayerId: layer.id,
    selectedObjectIds: [],
    history: [],
    historyIndex: -1,
  });

  return layer;
}

describe("documentStore", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProjectId: null,
      isDirty: false,
    });
  });

  it("restores active layer objects in original order after clear undo", () => {
    setLayer([rect("a"), rect("b"), rect("c")]);

    useDocumentStore.getState().clearActiveLayer();
    expect(useDocumentStore.getState().layers[0].objects).toHaveLength(0);

    useDocumentStore.getState().undo();

    expect(useDocumentStore.getState().layers[0].objects.map((obj) => obj.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
