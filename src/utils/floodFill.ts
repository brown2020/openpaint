import type { RGBA, Point } from "@/types";
import { colorsMatch, getPixelColor, setPixelColor } from "./colorUtils";

/**
 * Scanline flood fill algorithm
 * More efficient than recursive flood fill for large areas
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: RGBA,
  tolerance: number = 0
): ImageData {
  const { width, height } = imageData;

  // Bounds check
  startX = Math.floor(startX);
  startY = Math.floor(startY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return imageData;
  }

  const targetColor = getPixelColor(imageData, startX, startY);

  // Don't fill if the target color is the same as fill color
  if (colorsMatch(targetColor, fillColor, 0)) {
    return imageData;
  }

  // Create a copy of imageData to modify
  const newData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height
  );

  // Track visited pixels
  const visited = new Set<string>();
  const getKey = (x: number, y: number) => `${x},${y}`;

  // Stack for scanline algorithm
  const stack: Point[] = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const key = getKey(x, y);

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const currentColor = getPixelColor(newData, x, y);
    if (!colorsMatch(currentColor, targetColor, tolerance)) continue;

    visited.add(key);

    // Find the leftmost pixel in this row that matches
    let leftX = x;
    while (
      leftX > 0 &&
      colorsMatch(getPixelColor(newData, leftX - 1, y), targetColor, tolerance)
    ) {
      leftX--;
      visited.add(getKey(leftX, y));
    }

    // Find the rightmost pixel in this row that matches
    let rightX = x;
    while (
      rightX < width - 1 &&
      colorsMatch(getPixelColor(newData, rightX + 1, y), targetColor, tolerance)
    ) {
      rightX++;
      visited.add(getKey(rightX, y));
    }

    // Fill the entire row
    for (let fillX = leftX; fillX <= rightX; fillX++) {
      setPixelColor(newData, fillX, y, fillColor);

      // Check pixels above and below for the next iteration
      if (y > 0 && !visited.has(getKey(fillX, y - 1))) {
        const aboveColor = getPixelColor(newData, fillX, y - 1);
        if (colorsMatch(aboveColor, targetColor, tolerance)) {
          stack.push({ x: fillX, y: y - 1 });
        }
      }
      if (y < height - 1 && !visited.has(getKey(fillX, y + 1))) {
        const belowColor = getPixelColor(newData, fillX, y + 1);
        if (colorsMatch(belowColor, targetColor, tolerance)) {
          stack.push({ x: fillX, y: y + 1 });
        }
      }
    }
  }

  return newData;
}

/**
 * Fill at a point on a canvas context
 */
export function fillAtPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: RGBA,
  tolerance: number = 32
): void {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const filledData = floodFill(imageData, x, y, color, tolerance);
  ctx.putImageData(filledData, 0, 0);
}

/**
 * Simple recursive flood fill (for smaller areas)
 * Note: May cause stack overflow for large areas
 */
export function floodFillRecursive(
  imageData: ImageData,
  x: number,
  y: number,
  fillColor: RGBA,
  targetColor: RGBA,
  tolerance: number = 0,
  visited: Set<string> = new Set()
): void {
  const { width, height } = imageData;
  const key = `${x},${y}`;

  // Bounds and visited check
  if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
    return;
  }

  const currentColor = getPixelColor(imageData, x, y);

  // Check if current pixel matches target color
  if (!colorsMatch(currentColor, targetColor, tolerance)) {
    return;
  }

  visited.add(key);
  setPixelColor(imageData, x, y, fillColor);

  // Recursively fill adjacent pixels
  floodFillRecursive(imageData, x + 1, y, fillColor, targetColor, tolerance, visited);
  floodFillRecursive(imageData, x - 1, y, fillColor, targetColor, tolerance, visited);
  floodFillRecursive(imageData, x, y + 1, fillColor, targetColor, tolerance, visited);
  floodFillRecursive(imageData, x, y - 1, fillColor, targetColor, tolerance, visited);
}
