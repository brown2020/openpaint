// Tool Types
export type ToolType =
  | "brush"
  | "eraser"
  | "line"
  | "rectangle"
  | "ellipse"
  | "fill"
  | "eyedropper"
  | "text"
  | "selection";

export type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten";

export type BrushShape = "round" | "square";

// Geometry Types
export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

// Brush Settings
export interface BrushSettings {
  size: number;
  opacity: number;
  hardness: number;
  shape: BrushShape;
}

// Layer Types
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode: BlendMode;
}

export interface LayerData {
  id: string;
  imageData: ImageData | null;
}

// History Types
export type HistoryActionType =
  | "stroke"
  | "fill"
  | "shape"
  | "text"
  | "layer-add"
  | "layer-delete"
  | "layer-merge"
  | "layer-reorder"
  | "canvas-clear";

export interface HistoryEntry {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  layerId: string;
  snapshot: string; // Base64 encoded image data
}

// Selection Types
export interface Selection {
  type: "rectangular";
  bounds: Rectangle;
  active: boolean;
}

// Canvas State Types
export interface CanvasState {
  size: Size;
  zoom: number;
  pan: Point;
}

// Shape Tool Options
export interface ShapeOptions {
  fill: boolean;
  stroke: boolean;
  strokeWidth: number;
}

// Text Tool Options
export interface TextOptions {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
}

// Drawing State
export interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  pressure: number;
}

// Project Types (for save/load)
export interface Project {
  version: string;
  name: string;
  createdAt: string;
  modifiedAt: string;
  canvasSize: Size;
  layers: SerializedLayer[];
  activeLayerId: string;
}

export interface SerializedLayer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode: BlendMode;
  data: string; // Base64 encoded PNG
}

// Color Types
export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

// Keyboard Shortcut Types
export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
}

// Export Options
export interface ExportOptions {
  format: "png" | "jpeg" | "webp";
  quality?: number; // 0-1 for jpeg/webp
  backgroundColor?: string; // For jpeg (no transparency)
}
