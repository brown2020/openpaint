import type {
  VectorObject,
  VectorLayer,
  Fill,
  StrokeStyle,
  Transform2D,
  PathObject,
  RectangleObject,
  EllipseObject,
  LineObject,
  PolygonObject,
  TextObject,
  GroupObject,
  BoundingBox,
  Point2D,
} from "@/types/vector";

/** Options for the main render call */
export interface RenderOptions {
  /** Selected object IDs — draw selection outlines for these */
  selectedIds?: string[];
  /** Object currently being hovered */
  hoveredId?: string | null;
  /** Whether to show the grid */
  showGrid?: boolean;
  /** Grid spacing in pixels */
  gridSize?: number;
}

/**
 * Render the entire scene graph to a canvas context
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  layers: VectorLayer[],
  canvasWidth: number,
  canvasHeight: number,
  options: RenderOptions = {},
): void {
  // Clear canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw grid if enabled
  if (options.showGrid && options.gridSize) {
    drawGrid(ctx, canvasWidth, canvasHeight, options.gridSize);
  }

  // Render layers bottom-to-top
  for (const layer of layers) {
    if (!layer.visible) continue;

    ctx.save();
    ctx.globalAlpha = layer.opacity;

    for (const obj of layer.objects) {
      renderObject(ctx, obj);
    }

    ctx.restore();
  }
}

/**
 * Render selection outlines on an overlay canvas
 */
export function renderSelectionOverlay(
  ctx: CanvasRenderingContext2D,
  layers: VectorLayer[],
  selectedIds: string[],
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (selectedIds.length === 0) return;

  const selectedSet = new Set(selectedIds);

  for (const layer of layers) {
    if (!layer.visible) continue;
    for (const obj of layer.objects) {
      renderSelectionForObject(ctx, obj, selectedSet);
    }
  }
}

/**
 * Render a single vector object
 */
function renderObject(ctx: CanvasRenderingContext2D, obj: VectorObject): void {
  if (!obj.visible) return;

  ctx.save();
  applyTransform(ctx, obj.transform);
  ctx.globalAlpha *= obj.opacity;

  switch (obj.type) {
    case "rectangle":
      renderRectangle(ctx, obj);
      break;
    case "ellipse":
      renderEllipse(ctx, obj);
      break;
    case "path":
      renderPath(ctx, obj);
      break;
    case "line":
      renderLine(ctx, obj);
      break;
    case "polygon":
      renderPolygon(ctx, obj);
      break;
    case "text":
      renderText(ctx, obj);
      break;
    case "group":
      renderGroup(ctx, obj);
      break;
  }

  ctx.restore();
}

// ---- Shape renderers ----

function renderRectangle(
  ctx: CanvasRenderingContext2D,
  obj: RectangleObject,
): void {
  ctx.beginPath();

  const [tl, tr, br, bl] = obj.cornerRadius;
  const hasRadius = tl > 0 || tr > 0 || br > 0 || bl > 0;

  if (hasRadius) {
    ctx.roundRect(0, 0, obj.width, obj.height, [tl, tr, br, bl]);
  } else {
    ctx.rect(0, 0, obj.width, obj.height);
  }

  applyFill(ctx, obj.fill);
  applyStroke(ctx, obj.stroke);
}

function renderEllipse(
  ctx: CanvasRenderingContext2D,
  obj: EllipseObject,
): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, obj.radiusX, obj.radiusY, 0, 0, Math.PI * 2);

  applyFill(ctx, obj.fill);
  applyStroke(ctx, obj.stroke);
}

function renderPath(ctx: CanvasRenderingContext2D, obj: PathObject): void {
  ctx.beginPath();
  buildPath(ctx, obj);

  applyFill(ctx, obj.fill);
  applyStroke(ctx, obj.stroke);
}

function renderLine(ctx: CanvasRenderingContext2D, obj: LineObject): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(obj.endX, obj.endY);

  // Lines don't typically have fill
  applyStroke(ctx, obj.stroke);
}

function renderPolygon(
  ctx: CanvasRenderingContext2D,
  obj: PolygonObject,
): void {
  ctx.beginPath();
  buildPolygonPath(ctx, obj.sides, obj.radius);

  applyFill(ctx, obj.fill);
  applyStroke(ctx, obj.stroke);
}

function renderText(ctx: CanvasRenderingContext2D, obj: TextObject): void {
  ctx.font = `${obj.fontStyle} ${obj.fontWeight} ${obj.fontSize}px ${obj.fontFamily}`;
  ctx.textAlign = obj.textAlign;
  ctx.textBaseline = "top";

  if (obj.fill) {
    setFillStyle(ctx, obj.fill);
    ctx.fillText(obj.content, 0, 0);
  }

  if (obj.stroke) {
    setStrokeStyle(ctx, obj.stroke);
    ctx.strokeText(obj.content, 0, 0);
  }
}

function renderGroup(ctx: CanvasRenderingContext2D, obj: GroupObject): void {
  for (const child of obj.children) {
    renderObject(ctx, child);
  }
}

// ---- Selection rendering ----

function renderSelectionForObject(
  ctx: CanvasRenderingContext2D,
  obj: VectorObject,
  selectedSet: Set<string>,
): void {
  if (!obj.visible) return;

  if (obj.type === "group") {
    ctx.save();
    applyTransform(ctx, obj.transform);
    for (const child of obj.children) {
      renderSelectionForObject(ctx, child, selectedSet);
    }
    ctx.restore();
  }

  if (!selectedSet.has(obj.id)) return;

  const bounds = getLocalBoundsForSelection(obj);

  ctx.save();
  applyTransform(ctx, obj.transform);

  // Selection outline
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

  // Resize handles (8 points)
  const handleSize = 6;
  const handles = getHandlePositions(bounds);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 1;

  for (const h of handles) {
    ctx.fillRect(
      h.x - handleSize / 2,
      h.y - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx.strokeRect(
      h.x - handleSize / 2,
      h.y - handleSize / 2,
      handleSize,
      handleSize,
    );
  }

  ctx.restore();
}

// ---- Helpers ----

function applyTransform(ctx: CanvasRenderingContext2D, t: Transform2D): void {
  ctx.translate(t.x, t.y);
  if (t.rotation !== 0) {
    ctx.rotate((t.rotation * Math.PI) / 180);
  }
  if (t.scaleX !== 1 || t.scaleY !== 1) {
    ctx.scale(t.scaleX, t.scaleY);
  }
}

function setFillStyle(ctx: CanvasRenderingContext2D, fill: Fill): void {
  switch (fill.type) {
    case "solid": {
      ctx.fillStyle = hexWithOpacity(fill.color, fill.opacity);
      break;
    }
    case "linear-gradient": {
      const grad = ctx.createLinearGradient(
        fill.startX,
        fill.startY,
        fill.endX,
        fill.endY,
      );
      for (const stop of fill.stops) {
        grad.addColorStop(
          stop.offset,
          hexWithOpacity(stop.color, stop.opacity),
        );
      }
      ctx.fillStyle = grad;
      break;
    }
    case "radial-gradient": {
      const grad = ctx.createRadialGradient(
        fill.centerX,
        fill.centerY,
        0,
        fill.centerX,
        fill.centerY,
        fill.radius,
      );
      for (const stop of fill.stops) {
        grad.addColorStop(
          stop.offset,
          hexWithOpacity(stop.color, stop.opacity),
        );
      }
      ctx.fillStyle = grad;
      break;
    }
  }
}

function setStrokeStyle(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeStyle,
): void {
  ctx.strokeStyle = hexWithOpacity(stroke.color, stroke.opacity);
  ctx.lineWidth = stroke.width;
  ctx.lineCap = stroke.lineCap;
  ctx.lineJoin = stroke.lineJoin;
  if (stroke.dashArray.length > 0) {
    ctx.setLineDash(stroke.dashArray);
  } else {
    ctx.setLineDash([]);
  }
}

function applyFill(
  ctx: CanvasRenderingContext2D,
  fill: Fill | null,
): void {
  if (!fill) return;
  setFillStyle(ctx, fill);
  ctx.fill();
}

function applyStroke(
  ctx: CanvasRenderingContext2D,
  stroke: StrokeStyle | null,
): void {
  if (!stroke) return;
  setStrokeStyle(ctx, stroke);
  ctx.stroke();
}

/**
 * Build a Canvas2D path from path segments
 */
export function buildPath(
  ctx: CanvasRenderingContext2D,
  obj: PathObject,
): void {
  for (const seg of obj.segments) {
    switch (seg.type) {
      case "M":
        ctx.moveTo(seg.x, seg.y);
        break;
      case "L":
        ctx.lineTo(seg.x, seg.y);
        break;
      case "C":
        ctx.bezierCurveTo(
          seg.cp1x,
          seg.cp1y,
          seg.cp2x,
          seg.cp2y,
          seg.x,
          seg.y,
        );
        break;
      case "Q":
        ctx.quadraticCurveTo(seg.cpx, seg.cpy, seg.x, seg.y);
        break;
      case "Z":
        ctx.closePath();
        break;
    }
  }
}

/**
 * Build a regular polygon path
 */
function buildPolygonPath(
  ctx: CanvasRenderingContext2D,
  sides: number,
  radius: number,
): void {
  const angleStep = (Math.PI * 2) / sides;
  // Start from top (−π/2)
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
}

/**
 * Convert hex color to rgba string with opacity
 */
function hexWithOpacity(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/**
 * Get local bounding box for selection overlay
 */
function getLocalBoundsForSelection(obj: VectorObject): BoundingBox {
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
    case "path": {
      // Derive from segments
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const seg of obj.segments) {
        if ("x" in seg && "y" in seg) {
          minX = Math.min(minX, seg.x);
          minY = Math.min(minY, seg.y);
          maxX = Math.max(maxX, seg.x);
          maxY = Math.max(maxY, seg.y);
        }
      }
      if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }
    case "text":
      return {
        x: 0,
        y: 0,
        width: obj.content.length * obj.fontSize * 0.6,
        height: obj.fontSize * obj.lineHeight,
      };
    case "group":
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * Get the 8 selection handle positions for a bounding box
 */
function getHandlePositions(bounds: BoundingBox): Point2D[] {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    { x, y }, // top-left
    { x: cx, y }, // top-center
    { x: x + width, y }, // top-right
    { x: x + width, y: cy }, // middle-right
    { x: x + width, y: y + height }, // bottom-right
    { x: cx, y: y + height }, // bottom-center
    { x, y: y + height }, // bottom-left
    { x, y: cy }, // middle-left
  ];
}

/**
 * Draw a grid overlay
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;

  ctx.beginPath();
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();
}
