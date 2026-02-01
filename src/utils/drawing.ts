import type { Point, Rectangle } from "@/types";

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Interpolate points between two points for smooth drawing
 * Uses Bresenham-like spacing to ensure no gaps
 */
export function interpolatePoints(
  from: Point,
  to: Point,
  spacing: number = 1
): Point[] {
  const points: Point[] = [];
  const dist = distance(from, to);

  if (dist < spacing) {
    return [to];
  }

  const steps = Math.ceil(dist / spacing);
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    points.push({
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    });
  }

  return points;
}

/**
 * Draw a line on canvas context
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  size: number,
  opacity: number = 1
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw a circle/dot on canvas context
 */
export function drawCircle(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  color: string,
  fill: boolean = true,
  opacity: number = 1
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draw a rectangle on canvas context
 */
export function drawRectangle(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  color: string,
  fill: boolean = true,
  strokeWidth: number = 1,
  opacity: number = 1
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  if (fill) {
    ctx.fillStyle = color;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
  ctx.restore();
}

/**
 * Draw an ellipse on canvas context
 */
export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  color: string,
  fill: boolean = true,
  strokeWidth: number = 1,
  opacity: number = 1
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const radiusX = Math.abs(rect.width / 2);
  const radiusY = Math.abs(rect.height / 2);

  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);

  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Calculate rectangle from two corner points
 * Handles negative widths/heights for any drag direction
 */
export function calculateRect(start: Point, end: Point): Rectangle {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

/**
 * Constrain a point to create a square (shift key modifier)
 */
export function constrainToSquare(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));

  return {
    x: start.x + size * Math.sign(dx),
    y: start.y + size * Math.sign(dy),
  };
}

/**
 * Constrain line angle to 45-degree increments (shift key modifier)
 */
export function constrainAngle(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return end;

  // Calculate angle and snap to nearest 45 degrees
  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

  return {
    x: start.x + length * Math.cos(snappedAngle),
    y: start.y + length * Math.sin(snappedAngle),
  };
}

/**
 * Calculate rectangle from center point (alt key modifier)
 */
export function rectFromCenter(center: Point, corner: Point): Rectangle {
  const dx = corner.x - center.x;
  const dy = corner.y - center.y;

  return {
    x: center.x - Math.abs(dx),
    y: center.y - Math.abs(dy),
    width: Math.abs(dx) * 2,
    height: Math.abs(dy) * 2,
  };
}

/**
 * Erase at a point using destination-out composite
 */
export function eraseAt(
  ctx: CanvasRenderingContext2D,
  point: Point,
  size: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Erase a line using destination-out composite
 */
export function eraseLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  size: number
): void {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Clear a rectangular area
 */
export function clearRect(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle
): void {
  ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
}

/**
 * Fill entire canvas with a color
 */
export function fillCanvas(
  ctx: CanvasRenderingContext2D,
  color: string,
  width: number,
  height: number
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/**
 * Draw text on canvas
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  position: Point,
  fontFamily: string,
  fontSize: number,
  color: string,
  fontWeight: "normal" | "bold" = "normal",
  fontStyle: "normal" | "italic" = "normal",
  textAlign: "left" | "center" | "right" = "left"
): void {
  ctx.save();
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  ctx.textBaseline = "top";
  ctx.fillText(text, position.x, position.y);
  ctx.restore();
}

/**
 * Draw selection marching ants rectangle
 */
export function drawSelectionRect(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  offset: number = 0
): void {
  ctx.save();
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -offset;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

  ctx.strokeStyle = "#ffffff";
  ctx.lineDashOffset = -offset + 4;
  ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
}

/**
 * Get canvas content as ImageData
 */
export function getCanvasImageData(
  canvas: HTMLCanvasElement
): ImageData | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Put ImageData onto canvas
 */
export function putCanvasImageData(
  canvas: HTMLCanvasElement,
  imageData: ImageData
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Convert canvas to base64 data URL
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg" | "webp" = "png",
  quality: number = 0.92
): string {
  const mimeType = `image/${format}`;
  return canvas.toDataURL(mimeType, quality);
}

/**
 * Load an image onto a canvas
 */
export async function loadImageToCanvas(
  canvas: HTMLCanvasElement,
  src: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}
