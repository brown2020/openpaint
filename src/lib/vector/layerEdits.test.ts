import { beforeEach, describe, expect, it } from "vitest";
import { useDocumentStore } from "@/store/documentStore";
import { useProjectStore } from "@/store/projectStore";
import { createLayer, createSolidFill, createTransform } from "@/types/vector";
import type { RectangleObject } from "@/types/vector";
import {
  addLayerWithHistory,
  commitObjectFieldHistory,
  removeLayerWithHistory,
  removeObjectWithHistory,
  reorderLayerWithHistory,
  updateLayerWithHistory,
} from "./layerEdits";

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

describe("layerEdits history", () => {
  beforeEach(() => {
    useProjectStore.setState({ currentProjectId: null, isDirty: false });
    const layer = createLayer("layer-1", "Layer 1");
    layer.objects = [rect("a"), rect("b")];
    useDocumentStore.setState({
      layers: [layer],
      activeLayerId: layer.id,
      selectedObjectIds: [],
      history: [],
      historyIndex: -1,
    });
  });

  it("undoes adding and deleting a layer", () => {
    const id = addLayerWithHistory("Layer 2");
    expect(useDocumentStore.getState().layers.map((layer) => layer.id)).toContain(id);

    useDocumentStore.getState().undo();
    expect(useDocumentStore.getState().layers.map((layer) => layer.id)).toEqual([
      "layer-1",
    ]);
    expect(useDocumentStore.getState().activeLayerId).toBe("layer-1");

    useDocumentStore.getState().redo();
    expect(useDocumentStore.getState().activeLayerId).toBe(id);

    removeLayerWithHistory(id);
    expect(useDocumentStore.getState().layers).toHaveLength(1);

    useDocumentStore.getState().undo();
    expect(useDocumentStore.getState().layers.map((layer) => layer.id)).toContain(id);
  });

  it("undoes visibility, reorder, object delete, and a committed opacity edit", () => {
    updateLayerWithHistory("layer-1", { visible: false }, "Hide layer");
    expect(useDocumentStore.getState().layers[0]?.visible).toBe(false);
    useDocumentStore.getState().undo();
    expect(useDocumentStore.getState().layers[0]?.visible).toBe(true);

    const second = addLayerWithHistory("Layer 2");
    const from = useDocumentStore.getState().layers.findIndex((layer) => layer.id === second);
    reorderLayerWithHistory(from, 0);
    expect(useDocumentStore.getState().layers[0]?.id).toBe(second);
    useDocumentStore.getState().undo();
    expect(useDocumentStore.getState().layers[0]?.id).toBe("layer-1");

    removeObjectWithHistory("a");
    expect(useDocumentStore.getState().layers[0]?.objects.map((obj) => obj.id)).toEqual([
      "b",
    ]);
    useDocumentStore.getState().undo();
    expect(useDocumentStore.getState().layers[0]?.objects.map((obj) => obj.id)).toEqual([
      "a",
      "b",
    ]);

    useDocumentStore.getState().updateObject("a", { opacity: 0.4 });
    commitObjectFieldHistory("a", "opacity", 1, 0.4, "Change opacity");
    useDocumentStore.getState().undo();
    const restored = useDocumentStore.getState().getObject("a");
    expect(restored?.opacity).toBe(1);
  });
});
