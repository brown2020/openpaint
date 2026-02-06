// ============================================
// Vector Object Model Types
// ============================================

/** 2D point */
export interface Point2D {
  x: number;
  y: number;
}

/** Object transform in local coordinate space */
export interface Transform2D {
  x: number;
  y: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
}

/** Axis-aligned bounding box */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ---- Fill types ----

export interface SolidFill {
  type: "solid";
  color: string; // hex (#RRGGBB)
  opacity: number; // 0–1
}

export interface GradientStop {
  offset: number; // 0–1
  color: string;
  opacity: number;
}

export interface LinearGradientFill {
  type: "linear-gradient";
  stops: GradientStop[];
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface RadialGradientFill {
  type: "radial-gradient";
  stops: GradientStop[];
  centerX: number;
  centerY: number;
  radius: number;
}

export type Fill = SolidFill | LinearGradientFill | RadialGradientFill;

// ---- Stroke type ----

export interface StrokeStyle {
  color: string;
  opacity: number;
  width: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  dashArray: number[];
}

// ---- Path segments ----

export interface MoveToSegment {
  type: "M";
  x: number;
  y: number;
}

export interface LineToSegment {
  type: "L";
  x: number;
  y: number;
}

export interface CubicBezierSegment {
  type: "C";
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
  x: number;
  y: number;
}

export interface QuadraticBezierSegment {
  type: "Q";
  cpx: number;
  cpy: number;
  x: number;
  y: number;
}

export interface ClosePathSegment {
  type: "Z";
}

export type PathSegment =
  | MoveToSegment
  | LineToSegment
  | CubicBezierSegment
  | QuadraticBezierSegment
  | ClosePathSegment;

// ---- Vector object types ----

export type VectorObjectType =
  | "rectangle"
  | "ellipse"
  | "path"
  | "line"
  | "polygon"
  | "text"
  | "group";

/** Common properties shared by all vector objects */
export interface BaseVectorObject {
  id: string;
  type: VectorObjectType;
  name: string;
  transform: Transform2D;
  fill: Fill | null;
  stroke: StrokeStyle | null;
  opacity: number;
  visible: boolean;
  locked: boolean;
}

export interface RectangleObject extends BaseVectorObject {
  type: "rectangle";
  width: number;
  height: number;
  cornerRadius: [number, number, number, number]; // TL, TR, BR, BL
}

export interface EllipseObject extends BaseVectorObject {
  type: "ellipse";
  radiusX: number;
  radiusY: number;
}

export interface PathObject extends BaseVectorObject {
  type: "path";
  segments: PathSegment[];
  closed: boolean;
}

export interface LineObject extends BaseVectorObject {
  type: "line";
  endX: number; // end point relative to transform origin
  endY: number;
}

export interface PolygonObject extends BaseVectorObject {
  type: "polygon";
  sides: number;
  radius: number;
}

export interface TextObject extends BaseVectorObject {
  type: "text";
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: CanvasTextAlign;
  lineHeight: number;
}

export interface GroupObject extends BaseVectorObject {
  type: "group";
  children: VectorObject[];
}

export type VectorObject =
  | RectangleObject
  | EllipseObject
  | PathObject
  | LineObject
  | PolygonObject
  | TextObject
  | GroupObject;

// ---- Layer ----

export interface VectorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  objects: VectorObject[];
}

// ---- History ----

export type HistoryOperation =
  | { type: "add-object"; layerId: string; object: VectorObject; index: number }
  | { type: "remove-object"; layerId: string; object: VectorObject; index: number }
  | {
      type: "modify-object";
      objectId: string;
      layerId: string;
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    }
  | { type: "reorder-object"; layerId: string; fromIndex: number; toIndex: number }
  | { type: "add-layer"; layer: VectorLayer; index: number }
  | { type: "remove-layer"; layer: VectorLayer; index: number }
  | {
      type: "modify-layer";
      layerId: string;
      before: Record<string, unknown>;
      after: Record<string, unknown>;
    }
  | { type: "batch"; operations: HistoryOperation[] };

export interface HistoryEntry {
  id: string;
  operations: HistoryOperation[];
  timestamp: number;
  description: string;
}

// ---- Factory helpers ----

export function createTransform(x = 0, y = 0): Transform2D {
  return { x, y, rotation: 0, scaleX: 1, scaleY: 1 };
}

export function createSolidFill(color = "#000000", opacity = 1): SolidFill {
  return { type: "solid", color, opacity };
}

export function createStroke(
  color = "#000000",
  width = 2,
  opacity = 1,
): StrokeStyle {
  return {
    color,
    opacity,
    width,
    lineCap: "round",
    lineJoin: "round",
    dashArray: [],
  };
}

export function createLayer(id: string, name: string): VectorLayer {
  return {
    id,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    objects: [],
  };
}
