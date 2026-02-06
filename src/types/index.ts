export type ToolType =
  | "brush"
  | "eraser"
  | "line"
  | "rectangle"
  | "ellipse"
  | "polygon"
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

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  locked: boolean;
  blendMode: BlendMode;
}

export type HistoryActionType =
  | "stroke"
  | "fill"
  | "shape"
  | "text"
  | "layer-add"
  | "layer-delete"
  | "layer-merge"
  | "layer-reorder";

export interface HistoryEntry {
  id: string;
  type: HistoryActionType;
  timestamp: number;
  layerId: string;
  snapshot: string;
}

export interface Selection {
  type: "rectangular";
  bounds: Rectangle;
  active: boolean;
}

export interface ShapeOptions {
  fill: boolean;
  stroke: boolean;
  strokeWidth: number;
}

export interface TextOptions {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}
