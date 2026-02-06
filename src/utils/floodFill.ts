import type { RGBA, Point } from "@/types";
import { colorsMatch, getPixelColor, setPixelColor } from "./colorUtils";

export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  fillColor: RGBA,
  tolerance: number = 0
): ImageData {
  const { width, height } = imageData;

  startX = Math.floor(startX);
  startY = Math.floor(startY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return imageData;
  }

  const targetColor = getPixelColor(imageData, startX, startY);

  if (colorsMatch(targetColor, fillColor, 0)) {
    return imageData;
  }

  const newData = new ImageData(
    new Uint8ClampedArray(imageData.data),
    width,
    height
  );

  const visited = new Uint8Array(width * height);
  const stack: Point[] = [{ x: startX, y: startY }];

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const idx = y * width + x;

    if (visited[idx]) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const currentColor = getPixelColor(newData, x, y);
    if (!colorsMatch(currentColor, targetColor, tolerance)) continue;

    visited[idx] = 1;

    let leftX = x;
    while (
      leftX > 0 &&
      colorsMatch(getPixelColor(newData, leftX - 1, y), targetColor, tolerance)
    ) {
      leftX--;
      visited[y * width + leftX] = 1;
    }

    let rightX = x;
    while (
      rightX < width - 1 &&
      colorsMatch(getPixelColor(newData, rightX + 1, y), targetColor, tolerance)
    ) {
      rightX++;
      visited[y * width + rightX] = 1;
    }

    for (let fillX = leftX; fillX <= rightX; fillX++) {
      setPixelColor(newData, fillX, y, fillColor);

      if (y > 0 && !visited[(y - 1) * width + fillX]) {
        const aboveColor = getPixelColor(newData, fillX, y - 1);
        if (colorsMatch(aboveColor, targetColor, tolerance)) {
          stack.push({ x: fillX, y: y - 1 });
        }
      }
      if (y < height - 1 && !visited[(y + 1) * width + fillX]) {
        const belowColor = getPixelColor(newData, fillX, y + 1);
        if (colorsMatch(belowColor, targetColor, tolerance)) {
          stack.push({ x: fillX, y: y + 1 });
        }
      }
    }
  }

  return newData;
}

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
