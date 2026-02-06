import type {
  VectorObject,
  BoundingBox,
  Point2D,
  Transform2D,
  PathSegment,
} from "@/types/vector";

/**
 * Calculate the local-space bounding box of a vector object
 * (before transform is applied)
 */
export function getLocalBounds(obj: VectorObject): BoundingBox {
  switch (obj.type) {
    case "rectangle":
      return { x: 0, y: 0, width: obj.width, height: obj.height };

    case "ellipse":
      return {
        x: -obj.radiusX,
        y: -obj.radiusY,
        width: obj.radiusX * 2,
        height: obj.radiusY * 2,
      };

    case "line":
      return {
        x: Math.min(0, obj.endX),
        y: Math.min(0, obj.endY),
        width: Math.abs(obj.endX),
        height: Math.abs(obj.endY),
      };

    case "polygon":
      return {
        x: -obj.radius,
        y: -obj.radius,
        width: obj.radius * 2,
        height: obj.radius * 2,
      };

    case "path":
      return getPathBounds(obj.segments);

    case "text":
      // Approximate text bounds — accurate measurement requires a canvas context
      return {
        x: 0,
        y: 0,
        width: obj.content.length * obj.fontSize * 0.6,
        height: obj.fontSize * obj.lineHeight,
      };

    case "group": {
      if (obj.children.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      const childBounds = obj.children.map(getWorldBounds);
      return mergeBounds(childBounds);
    }
  }
}

/**
 * Calculate world-space bounding box (with transform applied)
 */
export function getWorldBounds(obj: VectorObject): BoundingBox {
  const local = getLocalBounds(obj);
  return transformBounds(local, obj.transform);
}

/**
 * Apply a transform to a bounding box and return the enclosing AABB
 */
export function transformBounds(
  bounds: BoundingBox,
  transform: Transform2D,
): BoundingBox {
  // Get the four corners of the local bounding box
  const corners: Point2D[] = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { x: bounds.x, y: bounds.y + bounds.height },
  ];

  // Transform each corner to world space
  const transformed = corners.map((p) => localToWorld(p, transform));

  // Find enclosing AABB
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const p of transformed) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Merge multiple bounding boxes into one enclosing box
 */
export function mergeBounds(boxes: BoundingBox[]): BoundingBox {
  if (boxes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Transform a point from local object space to world space
 */
export function localToWorld(point: Point2D, transform: Transform2D): Point2D {
  let { x, y } = point;

  // Scale
  x *= transform.scaleX;
  y *= transform.scaleY;

  // Rotate
  if (transform.rotation !== 0) {
    const rad = (transform.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    x = rx;
    y = ry;
  }

  // Translate
  x += transform.x;
  y += transform.y;

  return { x, y };
}

/**
 * Transform a point from world space to local object space
 */
export function worldToLocal(point: Point2D, transform: Transform2D): Point2D {
  // Inverse translate
  let x = point.x - transform.x;
  let y = point.y - transform.y;

  // Inverse rotate
  if (transform.rotation !== 0) {
    const rad = (-transform.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = x * cos - y * sin;
    const ry = x * sin + y * cos;
    x = rx;
    y = ry;
  }

  // Inverse scale
  if (transform.scaleX !== 0) x /= transform.scaleX;
  if (transform.scaleY !== 0) y /= transform.scaleY;

  return { x, y };
}

/**
 * Check if a point is inside a bounding box
 */
export function pointInBounds(point: Point2D, bounds: BoundingBox): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * Check if two bounding boxes intersect
 */
export function boundsIntersect(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Calculate bounding box of path segments
 */
function getPathBounds(segments: PathSegment[]): BoundingBox {
  if (segments.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const include = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  for (const seg of segments) {
    switch (seg.type) {
      case "M":
      case "L":
        include(seg.x, seg.y);
        break;
      case "C":
        include(seg.cp1x, seg.cp1y);
        include(seg.cp2x, seg.cp2y);
        include(seg.x, seg.y);
        break;
      case "Q":
        include(seg.cpx, seg.cpy);
        include(seg.x, seg.y);
        break;
      // Z has no coordinates
    }
  }

  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
