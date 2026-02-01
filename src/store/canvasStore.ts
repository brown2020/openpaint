import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type {
  ToolType,
  BrushShape,
  Layer,
  Point,
  Size,
  HistoryEntry,
  Selection,
  ShapeOptions,
  TextOptions,
} from "@/types";

interface CanvasStore {
  // Tool State
  activeTool: ToolType;
  brushColor: string;
  brushSize: number;
  brushOpacity: number;
  brushShape: BrushShape;

  // Shape Tool Options
  shapeOptions: ShapeOptions;

  // Text Tool Options
  textOptions: TextOptions;

  // Canvas State
  canvasSize: Size;
  zoom: number;
  pan: Point;

  // Layers
  layers: Layer[];
  activeLayerId: string;
  layerCanvases: Map<string, HTMLCanvasElement>;

  // History
  history: HistoryEntry[];
  historyIndex: number;
  maxHistoryLength: number;

  // Selection
  selection: Selection | null;

  // Cursor Position
  cursorPosition: Point | null;

  // Drawing State
  isDrawing: boolean;

  // Tool Actions
  setActiveTool: (tool: ToolType) => void;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushShape: (shape: BrushShape) => void;
  setShapeOptions: (options: Partial<ShapeOptions>) => void;
  setTextOptions: (options: Partial<TextOptions>) => void;

  // Canvas Actions
  setCanvasSize: (size: Size) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Layer Actions
  addLayer: () => void;
  deleteLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  mergeLayerDown: (id: string) => void;
  flattenLayers: () => void;
  registerLayerCanvas: (id: string, canvas: HTMLCanvasElement) => void;
  unregisterLayerCanvas: (id: string) => void;
  getLayerCanvas: (id: string) => HTMLCanvasElement | undefined;

  // History Actions
  addToHistory: (entry: Omit<HistoryEntry, "id" | "timestamp">) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Selection Actions
  setSelection: (selection: Selection | null) => void;
  clearSelection: () => void;

  // Cursor Actions
  setCursorPosition: (position: Point | null) => void;

  // Drawing State Actions
  setIsDrawing: (isDrawing: boolean) => void;

  // Project Actions
  newProject: (size?: Size) => void;
  clearCanvas: () => void;
}

const DEFAULT_CANVAS_SIZE: Size = { width: 800, height: 600 };

const createDefaultLayer = (name: string = "Layer 1"): Layer => ({
  id: uuidv4(),
  name,
  visible: true,
  opacity: 1,
  locked: false,
  blendMode: "source-over",
});

export const useCanvasStore = create<CanvasStore>((set, get) => {
  const initialLayer = createDefaultLayer();

  return {
    // Initial Tool State
    activeTool: "brush",
    brushColor: "#000000",
    brushSize: 5,
    brushOpacity: 1,
    brushShape: "round",

    // Initial Shape Options
    shapeOptions: {
      fill: true,
      stroke: true,
      strokeWidth: 2,
    },

    // Initial Text Options
    textOptions: {
      fontFamily: "Arial",
      fontSize: 24,
      fontWeight: "normal",
      fontStyle: "normal",
      textAlign: "left",
    },

    // Initial Canvas State
    canvasSize: DEFAULT_CANVAS_SIZE,
    zoom: 1,
    pan: { x: 0, y: 0 },

    // Initial Layers
    layers: [initialLayer],
    activeLayerId: initialLayer.id,
    layerCanvases: new Map(),

    // Initial History
    history: [],
    historyIndex: -1,
    maxHistoryLength: 50,

    // Initial Selection
    selection: null,

    // Initial Cursor
    cursorPosition: null,

    // Initial Drawing State
    isDrawing: false,

    // Tool Actions
    setActiveTool: (tool) => set({ activeTool: tool }),
    setBrushColor: (color) => set({ brushColor: color }),
    setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(100, size)) }),
    setBrushOpacity: (opacity) =>
      set({ brushOpacity: Math.max(0, Math.min(1, opacity)) }),
    setBrushShape: (shape) => set({ brushShape: shape }),
    setShapeOptions: (options) =>
      set((state) => ({
        shapeOptions: { ...state.shapeOptions, ...options },
      })),
    setTextOptions: (options) =>
      set((state) => ({
        textOptions: { ...state.textOptions, ...options },
      })),

    // Canvas Actions
    setCanvasSize: (size) => set({ canvasSize: size }),
    setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(10, zoom)) }),
    setPan: (pan) => set({ pan }),
    zoomIn: () =>
      set((state) => ({ zoom: Math.min(10, state.zoom * 1.25) })),
    zoomOut: () =>
      set((state) => ({ zoom: Math.max(0.1, state.zoom / 1.25) })),
    resetZoom: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),

    // Layer Actions
    addLayer: () => {
      const { layers } = get();
      const newLayer = createDefaultLayer(`Layer ${layers.length + 1}`);
      set({
        layers: [...layers, newLayer],
        activeLayerId: newLayer.id,
      });
    },

    deleteLayer: (id) => {
      const { layers, activeLayerId, layerCanvases } = get();
      if (layers.length <= 1) return; // Keep at least one layer

      const newLayers = layers.filter((l) => l.id !== id);
      const newActiveId =
        activeLayerId === id ? newLayers[newLayers.length - 1].id : activeLayerId;

      layerCanvases.delete(id);

      set({
        layers: newLayers,
        activeLayerId: newActiveId,
      });
    },

    duplicateLayer: (id) => {
      const { layers } = get();
      const layerIndex = layers.findIndex((l) => l.id === id);
      if (layerIndex === -1) return;

      const original = layers[layerIndex];
      const duplicate: Layer = {
        ...original,
        id: uuidv4(),
        name: `${original.name} Copy`,
      };

      const newLayers = [...layers];
      newLayers.splice(layerIndex + 1, 0, duplicate);

      set({
        layers: newLayers,
        activeLayerId: duplicate.id,
      });
    },

    setActiveLayer: (id) => set({ activeLayerId: id }),

    updateLayer: (id, updates) =>
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? { ...l, ...updates } : l
        ),
      })),

    reorderLayers: (fromIndex, toIndex) => {
      const { layers } = get();
      const newLayers = [...layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      set({ layers: newLayers });
    },

    mergeLayerDown: (id) => {
      const { layers } = get();
      const layerIndex = layers.findIndex((l) => l.id === id);
      if (layerIndex <= 0) return; // Can't merge the bottom layer

      // The actual merging of canvas content happens in the component
      // Here we just update the layer structure
      const newLayers = layers.filter((l) => l.id !== id);
      set({
        layers: newLayers,
        activeLayerId: newLayers[layerIndex - 1].id,
      });
    },

    flattenLayers: () => {
      const { layers } = get();
      if (layers.length <= 1) return;

      const flattenedLayer = createDefaultLayer("Flattened");
      set({
        layers: [flattenedLayer],
        activeLayerId: flattenedLayer.id,
      });
    },

    registerLayerCanvas: (id, canvas) => {
      const { layerCanvases } = get();
      layerCanvases.set(id, canvas);
      set({ layerCanvases: new Map(layerCanvases) });
    },

    unregisterLayerCanvas: (id) => {
      const { layerCanvases } = get();
      layerCanvases.delete(id);
      set({ layerCanvases: new Map(layerCanvases) });
    },

    getLayerCanvas: (id) => {
      return get().layerCanvases.get(id);
    },

    // History Actions
    addToHistory: (entry) => {
      const { history, historyIndex, maxHistoryLength } = get();

      const newEntry: HistoryEntry = {
        ...entry,
        id: uuidv4(),
        timestamp: Date.now(),
      };

      // Remove any redo history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newEntry);

      // Trim history if it exceeds max length
      if (newHistory.length > maxHistoryLength) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const { historyIndex } = get();
      if (historyIndex >= 0) {
        set({ historyIndex: historyIndex - 1 });
      }
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < history.length - 1) {
        set({ historyIndex: historyIndex + 1 });
      }
    },

    canUndo: () => get().historyIndex >= 0,
    canRedo: () => {
      const { history, historyIndex } = get();
      return historyIndex < history.length - 1;
    },

    clearHistory: () => set({ history: [], historyIndex: -1 }),

    // Selection Actions
    setSelection: (selection) => set({ selection }),
    clearSelection: () => set({ selection: null }),

    // Cursor Actions
    setCursorPosition: (position) => set({ cursorPosition: position }),

    // Drawing State Actions
    setIsDrawing: (isDrawing) => set({ isDrawing }),

    // Project Actions
    newProject: (size = DEFAULT_CANVAS_SIZE) => {
      const newLayer = createDefaultLayer();
      set({
        canvasSize: size,
        layers: [newLayer],
        activeLayerId: newLayer.id,
        layerCanvases: new Map(),
        history: [],
        historyIndex: -1,
        selection: null,
        zoom: 1,
        pan: { x: 0, y: 0 },
      });
    },

    clearCanvas: () => {
      // The actual clearing happens in the component
      // This triggers a re-render and history update
      const { activeLayerId } = get();
      get().addToHistory({
        type: "canvas-clear",
        layerId: activeLayerId,
        snapshot: "",
      });
    },
  };
});
