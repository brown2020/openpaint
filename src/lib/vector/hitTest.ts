import type {
  VectorObject,
  VectorLayer,
  Point2D,
  PathObject,
} from "@/types/vector";
import { worldToLocal } from "./bounds";
import { buildPath } from "./renderer";

/** Result of a hit test */
export interface HitTestResult {
  object: VectorObject;
  layerId: string;
}

/**
 * Hit-test all layers top-to-bottom (reverse render order)
 * to find the topmost object under a given canvas point.
 *
 * Requires a CanvasRenderingContext2D for path-based hit testing
 * (isPointInPath / isPointInStroke).
 */
export function hitTestLayers(
  ctx: CanvasRenderingContext2D,
  point: Point2D,
  layers: VectorLayer[],
): HitTestResult | null {
  // Walk layers top-to-bottom
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (!layer.visible || layer.locked) continue;

    const result = hitTestObjects(ctx, point, layer.objects, layer.id);
    if (result) return result;
  }

  return null;
}

/**
 * Hit-test a list of objects top-to-bottom
 */
function hitTestObjects(
  ctx: CanvasRenderingContext2D,
  point: Point2D,
  objects: VectorObject[],
  layerId: string,
): HitTestResult | null {
  // Walk objects top-to-bottom (last rendered = on top)
  for (let i = objects.length - 1; i >= 0; i--) {
    const obj = objects[i];
    if (!obj.visible || obj.locked) continue;

    if (hitTestObject(ctx, point, obj)) {
      return { object: obj, layerId };
    }
  }

  return null;
}

/**
 * Hit-test a single vector object
 */
function hitTestObject(
  ctx: CanvasRenderingContext2D,
  worldPoint: Point2D,
  obj: VectorObject,
): boolean {
  // Transform point to object's local space
  const local = worldToLocal(worldPoint, obj.transform);

  switch (obj.type) {
    case "rectangle":
      return hitTestRectangle(local, obj.width, obj.height);

    case "ellipse":
      return hitTestEllipse(local, obj.radiusX, obj.radiusY);

    case "line":
      return hitTestLine(local, obj.endX, obj.endY);

    case "polygon":
      return hitTestPolygon(local, obj.sides, obj.radius);

    case "path":
      return hitTestPath(ctx, local, obj);

    case "text":
      return hitTestText(local, obj.content.length * obj.fontSize * 0.6, obj.fontSize * obj.lineHeight);

    case "group": {
      // Test children in reverse (topmost first)
      for (let i = obj.children.length - 1; i >= 0; i--) {
        if (hitTestObject(ctx, local, obj.children[i])) {
          return true;
        }
      }
      return false;
    }
  }
}

// ---- Per-type hit tests ----

function hitTestRectangle(
  local: Point2D,
  width: number,
  height: number,
): boolean {
  return (
    local.x >= 0 &&
    local.x <= width &&
    local.y >= 0 &&
    local.y <= height
  );
}

function hitTestEllipse(
  local: Point2D,
  radiusX: number,
  radiusY: number,
): boolean {
  if (radiusX === 0 || radiusY === 0) return false;
  const nx = local.x / radiusX;
  const ny = local.y / radiusY;
  return nx * nx + ny * ny <= 1;
}

function hitTestLine(
  local: Point2D,
  endX: number,
  endY: number,
): boolean {
  // Distance from point to line segment (0,0) → (endX, endY)
  const tolerance = 5; // px
  const dx = endX;
  const dy = endY;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Degenerate line (start == end)
    return Math.hypot(local.x, local.y) <= tolerance;
  }

  // Project point onto line, clamped to segment
  const t = Math.max(0, Math.min(1, (local.x * dx + local.y * dy) / lenSq));
  const projX = t * dx;
  const projY = t * dy;
  const dist = Math.hypot(local.x - projX, local.y - projY);

  return dist <= tolerance;
}

function hitTestPolygon(
  local: Point2D,
  sides: number,
  radius: number,
): boolean {
  // Approximate: check if point is within the circumscribed circle
  // For precise testing, we'd use point-in-polygon on the vertices
  // but this is good enough and much simpler
  return Math.hypot(local.x, local.y) <= radius;
}

function hitTestPath(
  ctx: CanvasRenderingContext2D,
  local: Point2D,
  obj: PathObject,
): boolean {
  // Use Canvas2D path for hit testing
  ctx.save();
  ctx.beginPath();
  buildPath(ctx, obj);

  const inFill = obj.fill ? ctx.isPointInPath(local.x, local.y) : false;
  const inStroke = obj.stroke
    ? (() => {
        ctx.lineWidth = Math.max(obj.stroke.width, 5); // minimum hit area
        return ctx.isPointInStroke(local.x, local.y);
      })()
    : false;

  ctx.restore();
  return inFill || inStroke;
}

function hitTestText(
  local: Point2D,
  approxWidth: number,
  approxHeight: number,
): boolean {
  return (
    local.x >= 0 &&
    local.x <= approxWidth &&
    local.y >= 0 &&
    local.y <= approxHeight
  );
}
