import { useDocumentStore } from "@/store/documentStore";
import type { VectorLayer } from "@/types/vector";

function cloneLayer(layer: VectorLayer): VectorLayer {
  return structuredClone(layer);
}

/** Add a layer and record an undoable add-layer operation. */
export function addLayerWithHistory(name?: string): string {
  const store = useDocumentStore.getState();
  const id = store.addLayer(name);
  const layers = useDocumentStore.getState().layers;
  const index = layers.findIndex((layer) => layer.id === id);
  const layer = layers[index];
  if (!layer || index < 0) return id;

  store.pushHistory("Add layer", [
    { type: "add-layer", layer: cloneLayer(layer), index },
  ]);
  return id;
}

/** Delete a layer and record an undoable remove-layer operation. */
export function removeLayerWithHistory(layerId: string): void {
  const store = useDocumentStore.getState();
  if (store.layers.length <= 1) return;

  const index = store.layers.findIndex((layer) => layer.id === layerId);
  const layer = store.layers[index];
  if (!layer || index < 0) return;

  const snapshot = cloneLayer(layer);
  store.removeLayer(layerId);
  store.pushHistory("Delete layer", [
    { type: "remove-layer", layer: snapshot, index },
  ]);
}

/** Update layer metadata and record the previous values. */
export function updateLayerWithHistory(
  layerId: string,
  updates: Partial<Omit<VectorLayer, "id" | "objects">>,
  description: string,
): void {
  const store = useDocumentStore.getState();
  const layer = store.layers.find((item) => item.id === layerId);
  if (!layer) return;

  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const key of Object.keys(updates) as (keyof typeof updates)[]) {
    before[key] = layer[key];
    after[key] = updates[key];
  }

  store.updateLayer(layerId, updates);
  store.pushHistory(description, [
    { type: "modify-layer", layerId, before, after },
  ]);
}

/** Record one history entry after a live layer-field edit such as an opacity drag. */
export function commitLayerFieldHistory(
  layerId: string,
  field: string,
  before: unknown,
  after: unknown,
  description: string,
): void {
  if (before === after) return;
  useDocumentStore.getState().pushHistory(description, [
    {
      type: "modify-layer",
      layerId,
      before: { [field]: before },
      after: { [field]: after },
    },
  ]);
}

export function reorderLayerWithHistory(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex) return;
  const store = useDocumentStore.getState();
  store.reorderLayer(fromIndex, toIndex);
  store.pushHistory("Reorder layer", [
    { type: "reorder-layer", fromIndex, toIndex },
  ]);
}

export function updateObjectWithHistory(
  objectId: string,
  updates: Record<string, unknown>,
  description: string,
): void {
  const store = useDocumentStore.getState();
  const obj = store.getObject(objectId);
  const layerId = store.getObjectLayerId(objectId);
  if (!obj || !layerId) return;

  const record = obj as unknown as Record<string, unknown>;
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    before[key] = record[key];
    after[key] = updates[key];
  }

  store.updateObject(objectId, updates);
  store.pushHistory(description, [
    { type: "modify-object", objectId, layerId, before, after },
  ]);
}

/** Record one history entry after a live object-field edit such as an opacity drag. */
export function commitObjectFieldHistory(
  objectId: string,
  field: string,
  before: unknown,
  after: unknown,
  description: string,
): void {
  if (before === after) return;
  const store = useDocumentStore.getState();
  const layerId = store.getObjectLayerId(objectId);
  if (!layerId) return;

  store.pushHistory(description, [
    {
      type: "modify-object",
      objectId,
      layerId,
      before: { [field]: before },
      after: { [field]: after },
    },
  ]);
}

export function removeObjectWithHistory(objectId: string): void {
  const store = useDocumentStore.getState();
  const obj = store.getObject(objectId);
  const layerId = store.getObjectLayerId(objectId);
  if (!obj || !layerId) return;

  const layer = store.layers.find((item) => item.id === layerId);
  const index = layer?.objects.findIndex((item) => item.id === objectId) ?? -1;
  if (index < 0) return;

  store.removeObject(objectId);
  store.pushHistory("Delete object", [
    { type: "remove-object", layerId, object: obj, index },
  ]);
}

export function reorderObjectWithHistory(
  layerId: string,
  fromIndex: number,
  toIndex: number,
): void {
  if (fromIndex === toIndex) return;
  const store = useDocumentStore.getState();
  store.reorderObject(layerId, fromIndex, toIndex);
  store.pushHistory("Reorder object", [
    { type: "reorder-object", layerId, fromIndex, toIndex },
  ]);
}
