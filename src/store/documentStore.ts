import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  VectorObject,
  VectorLayer,
  HistoryEntry,
  HistoryOperation,
} from "@/types/vector";
import { createLayer } from "@/types/vector";

// ============================================
// Document Store — Scene Graph + History
// ============================================

interface DocumentState {
  // Scene graph
  layers: VectorLayer[];
  activeLayerId: string;

  // Selection
  selectedObjectIds: string[];

  // History
  history: HistoryEntry[];
  historyIndex: number;
  maxHistoryLength: number;

  // Layer actions
  addLayer: (name?: string) => string;
  removeLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Omit<VectorLayer, "id" | "objects">>) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;

  // Object actions
  addObject: (layerId: string, object: VectorObject, index?: number) => void;
  removeObject: (objectId: string) => void;
  updateObject: (objectId: string, updates: Record<string, unknown>) => void;
  reorderObject: (layerId: string, fromIndex: number, toIndex: number) => void;

  // Selection actions
  selectObject: (objectId: string, addToSelection?: boolean) => void;
  deselectObject: (objectId: string) => void;
  deselectAll: () => void;
  selectAll: () => void;
  setSelection: (objectIds: string[]) => void;

  // History actions
  pushHistory: (description: string, operations: HistoryOperation[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Helpers
  getObject: (objectId: string) => VectorObject | undefined;
  getObjectLayerId: (objectId: string) => string | undefined;
  getActiveLayer: () => VectorLayer | undefined;
  getSelectedObjects: () => VectorObject[];

  // Document actions
  newDocument: (width?: number, height?: number) => void;
  loadDocument: (layers: VectorLayer[], activeLayerId: string) => void;
}

const DEFAULT_LAYER_NAME = "Layer 1";

function createDefaultLayers(): { layers: VectorLayer[]; activeLayerId: string } {
  const id = uuidv4();
  return {
    layers: [createLayer(id, DEFAULT_LAYER_NAME)],
    activeLayerId: id,
  };
}

export const useDocumentStore = create<DocumentState>((set, get) => {
  const defaults = createDefaultLayers();

  return {
    // Initial state
    layers: defaults.layers,
    activeLayerId: defaults.activeLayerId,
    selectedObjectIds: [],
    history: [],
    historyIndex: -1,
    maxHistoryLength: 200,

    // ---- Layer actions ----

    addLayer: (name) => {
      const id = uuidv4();
      const layerName = name ?? `Layer ${get().layers.length + 1}`;
      const layer = createLayer(id, layerName);

      set((state) => ({
        layers: [...state.layers, layer],
        activeLayerId: id,
      }));

      return id;
    },

    removeLayer: (layerId) => {
      const { layers, activeLayerId } = get();
      if (layers.length <= 1) return;

      const newLayers = layers.filter((l) => l.id !== layerId);
      const newActiveId =
        activeLayerId === layerId
          ? newLayers[newLayers.length - 1].id
          : activeLayerId;

      set({
        layers: newLayers,
        activeLayerId: newActiveId,
        selectedObjectIds: [],
      });
    },

    setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

    updateLayer: (layerId, updates) =>
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === layerId ? { ...l, ...updates } : l,
        ),
      })),

    reorderLayer: (fromIndex, toIndex) => {
      set((state) => {
        const newLayers = [...state.layers];
        const [removed] = newLayers.splice(fromIndex, 1);
        newLayers.splice(toIndex, 0, removed);
        return { layers: newLayers };
      });
    },

    // ---- Object actions ----

    addObject: (layerId, object, index) => {
      set((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== layerId) return layer;
          const objects = [...layer.objects];
          if (index !== undefined) {
            objects.splice(index, 0, object);
          } else {
            objects.push(object);
          }
          return { ...layer, objects };
        }),
      }));
    },

    removeObject: (objectId) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.filter((o) => o.id !== objectId),
        })),
        selectedObjectIds: state.selectedObjectIds.filter(
          (id) => id !== objectId,
        ),
      }));
    },

    updateObject: (objectId, updates) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          objects: layer.objects.map((obj) =>
            obj.id === objectId ? ({ ...obj, ...updates } as VectorObject) : obj,
          ),
        })),
      }));
    },

    reorderObject: (layerId, fromIndex, toIndex) => {
      set((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== layerId) return layer;
          const objects = [...layer.objects];
          const [removed] = objects.splice(fromIndex, 1);
          objects.splice(toIndex, 0, removed);
          return { ...layer, objects };
        }),
      }));
    },

    // ---- Selection actions ----

    selectObject: (objectId, addToSelection = false) => {
      set((state) => {
        if (addToSelection) {
          if (state.selectedObjectIds.includes(objectId)) {
            return {
              selectedObjectIds: state.selectedObjectIds.filter(
                (id) => id !== objectId,
              ),
            };
          }
          return {
            selectedObjectIds: [...state.selectedObjectIds, objectId],
          };
        }
        return { selectedObjectIds: [objectId] };
      });
    },

    deselectObject: (objectId) => {
      set((state) => ({
        selectedObjectIds: state.selectedObjectIds.filter(
          (id) => id !== objectId,
        ),
      }));
    },

    deselectAll: () => set({ selectedObjectIds: [] }),

    selectAll: () => {
      const { layers, activeLayerId } = get();
      const activeLayer = layers.find((l) => l.id === activeLayerId);
      if (!activeLayer) return;

      set({
        selectedObjectIds: activeLayer.objects
          .filter((o) => o.visible && !o.locked)
          .map((o) => o.id),
      });
    },

    setSelection: (objectIds) => set({ selectedObjectIds: objectIds }),

    // ---- History actions ----

    pushHistory: (description, operations) => {
      if (operations.length === 0) return;

      const entry: HistoryEntry = {
        id: uuidv4(),
        operations,
        timestamp: Date.now(),
        description,
      };

      set((state) => {
        // Truncate any redo entries
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(entry);

        // Trim if exceeds max
        if (newHistory.length > state.maxHistoryLength) {
          newHistory.shift();
          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }

        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < 0) return;

      const entry = history[historyIndex];
      applyOperationsReverse(get, set, entry.operations);
      set({ historyIndex: historyIndex - 1 });
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;

      const entry = history[historyIndex + 1];
      applyOperationsForward(get, set, entry.operations);
      set({ historyIndex: historyIndex + 1 });
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },
    clearHistory: () => set({ history: [], historyIndex: -1 }),

    // ---- Helpers ----

    getObject: (objectId) => {
      for (const layer of get().layers) {
        const found = findObjectInList(layer.objects, objectId);
        if (found) return found;
      }
      return undefined;
    },

    getObjectLayerId: (objectId) => {
      for (const layer of get().layers) {
        const found = findObjectInList(layer.objects, objectId);
        if (found) return layer.id;
      }
      return undefined;
    },

    getActiveLayer: () => {
      const { layers, activeLayerId } = get();
      return layers.find((l) => l.id === activeLayerId);
    },

    getSelectedObjects: () => {
      const { layers, selectedObjectIds } = get();
      if (selectedObjectIds.length === 0) return [];

      const selectedSet = new Set(selectedObjectIds);
      const result: VectorObject[] = [];

      for (const layer of layers) {
        for (const obj of layer.objects) {
          if (selectedSet.has(obj.id)) {
            result.push(obj);
          }
        }
      }

      return result;
    },

    // ---- Document actions ----

    newDocument: (width = 800, height = 600) => {
      const defaults = createDefaultLayers();
      set({
        layers: defaults.layers,
        activeLayerId: defaults.activeLayerId,
        selectedObjectIds: [],
        history: [],
        historyIndex: -1,
      });

      // Also update canvas size in canvasStore (if it exists)
      // This coupling is handled by the page component
      void width;
      void height;
    },

    loadDocument: (layers, activeLayerId) => {
      set({
        layers,
        activeLayerId,
        selectedObjectIds: [],
        history: [],
        historyIndex: -1,
      });
    },
  };
});

// ============================================
// History helpers — apply operations
// ============================================

type GetState = () => DocumentState;
type SetState = (
  partial: Partial<DocumentState> | ((state: DocumentState) => Partial<DocumentState>),
) => void;

/**
 * Apply operations in reverse (for undo)
 */
function applyOperationsReverse(
  get: GetState,
  setState: SetState,
  operations: HistoryOperation[],
): void {
  // Apply in reverse order
  for (let i = operations.length - 1; i >= 0; i--) {
    applyOperationReverse(get, setState, operations[i]);
  }
}

/**
 * Apply operations forward (for redo)
 */
function applyOperationsForward(
  get: GetState,
  setState: SetState,
  operations: HistoryOperation[],
): void {
  for (const op of operations) {
    applyOperationForward(get, setState, op);
  }
}

function applyOperationReverse(
  _get: GetState,
  setState: SetState,
  op: HistoryOperation,
): void {
  switch (op.type) {
    case "add-object":
      // Undo add = remove
      setState((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === op.layerId
            ? { ...layer, objects: layer.objects.filter((o) => o.id !== op.object.id) }
            : layer,
        ),
      }));
      break;

    case "remove-object":
      // Undo remove = re-insert at original index
      setState((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== op.layerId) return layer;
          const objects = [...layer.objects];
          objects.splice(op.index, 0, op.object);
          return { ...layer, objects };
        }),
      }));
      break;

    case "modify-object":
      // Undo modify = restore "before" properties
      setState((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === op.layerId
            ? {
                ...layer,
                objects: layer.objects.map((obj) =>
                  obj.id === op.objectId
                    ? ({ ...obj, ...op.before } as VectorObject)
                    : obj,
                ),
              }
            : layer,
        ),
      }));
      break;

    case "reorder-object":
      // Undo reorder = move back
      setState((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== op.layerId) return layer;
          const objects = [...layer.objects];
          const [removed] = objects.splice(op.toIndex, 1);
          objects.splice(op.fromIndex, 0, removed);
          return { ...layer, objects };
        }),
      }));
      break;

    case "add-layer":
      // Undo add layer = remove it
      setState((state) => ({
        layers: state.layers.filter((l) => l.id !== op.layer.id),
      }));
      break;

    case "remove-layer":
      // Undo remove layer = re-insert at original index
      setState((state) => {
        const layers = [...state.layers];
        layers.splice(op.index, 0, op.layer);
        return { layers };
      });
      break;

    case "modify-layer":
      // Undo modify layer = restore "before" properties
      setState((state) => ({
        layers: state.layers.map((l) =>
          l.id === op.layerId ? { ...l, ...op.before } : l,
        ),
      }));
      break;

    case "batch":
      applyOperationsReverse(_get, setState, op.operations);
      break;
  }
}

function applyOperationForward(
  _get: GetState,
  setState: SetState,
  op: HistoryOperation,
): void {
  switch (op.type) {
    case "add-object":
      // Redo add = re-insert
      setState((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== op.layerId) return layer;
          const objects = [...layer.objects];
          objects.splice(op.index, 0, op.object);
          return { ...layer, objects };
        }),
      }));
      break;

    case "remove-object":
      // Redo remove = remove again
      setState((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === op.layerId
            ? { ...layer, objects: layer.objects.filter((o) => o.id !== op.object.id) }
            : layer,
        ),
      }));
      break;

    case "modify-object":
      // Redo modify = apply "after" properties
      setState((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === op.layerId
            ? {
                ...layer,
                objects: layer.objects.map((obj) =>
                  obj.id === op.objectId
                    ? ({ ...obj, ...op.after } as VectorObject)
                    : obj,
                ),
              }
            : layer,
        ),
      }));
      break;

    case "reorder-object":
      // Redo reorder = move again
      setState((state) => ({
        layers: state.layers.map((layer) => {
          if (layer.id !== op.layerId) return layer;
          const objects = [...layer.objects];
          const [removed] = objects.splice(op.fromIndex, 1);
          objects.splice(op.toIndex, 0, removed);
          return { ...layer, objects };
        }),
      }));
      break;

    case "add-layer":
      setState((state) => {
        const layers = [...state.layers];
        layers.splice(op.index, 0, op.layer);
        return { layers };
      });
      break;

    case "remove-layer":
      setState((state) => ({
        layers: state.layers.filter((l) => l.id !== op.layer.id),
      }));
      break;

    case "modify-layer":
      setState((state) => ({
        layers: state.layers.map((l) =>
          l.id === op.layerId ? { ...l, ...op.after } : l,
        ),
      }));
      break;

    case "batch":
      applyOperationsForward(_get, setState, op.operations);
      break;
  }
}

// ============================================
// Scene graph traversal helpers
// ============================================

function findObjectInList(
  objects: VectorObject[],
  objectId: string,
): VectorObject | undefined {
  for (const obj of objects) {
    if (obj.id === objectId) return obj;
    if (obj.type === "group") {
      const found = findObjectInList(obj.children, objectId);
      if (found) return found;
    }
  }
  return undefined;
}
