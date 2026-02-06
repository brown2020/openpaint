import type { Point, Rectangle } from "@/types";

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

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

export function calculateRect(start: Point, end: Point): Rectangle {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function constrainToSquare(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const size = Math.max(Math.abs(dx), Math.abs(dy));

  return {
    x: start.x + size * Math.sign(dx),
    y: start.y + size * Math.sign(dy),
  };
}

export function constrainAngle(start: Point, end: Point): Point {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) return end;

  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

  return {
    x: start.x + length * Math.cos(snappedAngle),
    y: start.y + length * Math.sin(snappedAngle),
  };
}

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
