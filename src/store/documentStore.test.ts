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

  it("undoes and redoes a rectangle created on the active layer", () => {
    const layer = setLayer([]);
    const object = rect("rect-1");
    object.name = "Rectangle";
    object.width = 40;
    object.height = 20;

    const store = useDocumentStore.getState();
    store.addObject(layer.id, object);
    store.setSelection([object.id]);
    store.pushHistory("Create rectangle", [
      { type: "add-object", layerId: layer.id, object, index: 0 },
    ]);

    expect(useDocumentStore.getState().selectedObjectIds).toEqual(["rect-1"]);
    expect(useDocumentStore.getState().layers[0].objects).toMatchObject([
      { id: "rect-1", type: "rectangle", width: 40, height: 20 },
    ]);

    useDocumentStore.getState().undo();
    expect(useDocumentStore.getState().layers[0].objects).toHaveLength(0);

    useDocumentStore.getState().redo();
    expect(useDocumentStore.getState().layers[0].objects).toMatchObject([
      { id: "rect-1", type: "rectangle", width: 40, height: 20 },
    ]);
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
