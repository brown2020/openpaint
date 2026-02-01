"use client";

import { useCallback, useRef } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useHistory } from "./useHistory";
import type { Point, Rectangle } from "@/types";
import {
  drawLine,
  drawCircle,
  drawRectangle,
  drawEllipse,
  eraseLine,
  interpolatePoints,
  calculateRect,
  constrainToSquare,
  constrainAngle,
  rectFromCenter,
} from "@/utils/drawing";
import { fillAtPoint } from "@/utils/floodFill";
import { hexToRgba } from "@/utils/colorUtils";

interface DrawingOptions {
  canvas: HTMLCanvasElement | null;
  previewCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

/**
 * Hook for core drawing operations
 */
export function useDrawing(options: DrawingOptions) {
  const { canvas, previewCanvasRef } = options;

  const {
    activeTool,
    brushColor,
    brushSize,
    brushOpacity,
    shapeOptions,
    setBrushColor,
    setIsDrawing,
  } = useCanvasStore();

  const { saveBeforeOperation, commitOperation } = useHistory();

  const lastPointRef = useRef<Point | null>(null);
  const startPointRef = useRef<Point | null>(null);
  const isShiftHeldRef = useRef(false);
  const isAltHeldRef = useRef(false);

  /**
   * Get 2D context from canvas
   */
  const getContext = useCallback(
    (targetCanvas?: HTMLCanvasElement | null) => {
      const c = targetCanvas || canvas;
      if (!c) return null;
      return c.getContext("2d");
    },
    [canvas]
  );

  /**
   * Clear the preview canvas
   */
  const clearPreview = useCallback(() => {
    const previewCanvas = previewCanvasRef?.current;
    if (!previewCanvas) return;
    const ctx = getContext(previewCanvas);
    if (!ctx) return;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }, [previewCanvasRef, getContext]);

  /**
   * Start a brush stroke
   */
  const startBrushStroke = useCallback(
    (point: Point, pressure: number) => {
      if (!canvas) return;

      saveBeforeOperation(canvas);
      setIsDrawing(true);

      const ctx = getContext();
      if (!ctx) return;

      // Draw initial dot
      const size = brushSize * (pressure * 0.5 + 0.5); // Pressure affects size
      const opacity = brushOpacity * (pressure * 0.5 + 0.5); // Pressure affects opacity
      drawCircle(ctx, point, size / 2, brushColor, true, opacity);

      lastPointRef.current = point;
    },
    [canvas, saveBeforeOperation, setIsDrawing, getContext, brushSize, brushOpacity, brushColor]
  );

  /**
   * Continue a brush stroke
   */
  const continueBrushStroke = useCallback(
    (point: Point, pressure: number) => {
      const ctx = getContext();
      if (!ctx || !lastPointRef.current) return;

      const size = brushSize * (pressure * 0.5 + 0.5);
      const opacity = brushOpacity * (pressure * 0.5 + 0.5);

      // Interpolate points for smooth strokes
      const points = interpolatePoints(lastPointRef.current, point, size / 4);

      for (const p of points) {
        drawLine(ctx, lastPointRef.current, p, brushColor, size, opacity);
        lastPointRef.current = p;
      }

      lastPointRef.current = point;
    },
    [getContext, brushSize, brushOpacity, brushColor]
  );

  /**
   * End a brush stroke
   */
  const endBrushStroke = useCallback(() => {
    if (!canvas) return;

    setIsDrawing(false);
    commitOperation(canvas, "stroke");
    lastPointRef.current = null;
  }, [canvas, setIsDrawing, commitOperation]);

  /**
   * Start erasing
   */
  const startErasing = useCallback(
    (point: Point, pressure: number) => {
      if (!canvas) return;

      saveBeforeOperation(canvas);
      setIsDrawing(true);

      const ctx = getContext();
      if (!ctx) return;

      const size = brushSize * (pressure * 0.5 + 0.5);
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(point.x, point.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      lastPointRef.current = point;
    },
    [canvas, saveBeforeOperation, setIsDrawing, getContext, brushSize]
  );

  /**
   * Continue erasing
   */
  const continueErasing = useCallback(
    (point: Point, pressure: number) => {
      const ctx = getContext();
      if (!ctx || !lastPointRef.current) return;

      const size = brushSize * (pressure * 0.5 + 0.5);
      eraseLine(ctx, lastPointRef.current, point, size);
      lastPointRef.current = point;
    },
    [getContext, brushSize]
  );

  /**
   * End erasing
   */
  const endErasing = useCallback(() => {
    if (!canvas) return;

    setIsDrawing(false);
    commitOperation(canvas, "stroke");
    lastPointRef.current = null;
  }, [canvas, setIsDrawing, commitOperation]);

  /**
   * Start drawing a shape
   */
  const startShape = useCallback(
    (point: Point) => {
      if (!canvas) return;

      saveBeforeOperation(canvas);
      setIsDrawing(true);
      startPointRef.current = point;
    },
    [canvas, saveBeforeOperation, setIsDrawing]
  );

  /**
   * Preview shape while dragging
   */
  const previewShape = useCallback(
    (point: Point, shiftHeld: boolean, altHeld: boolean) => {
      const previewCanvas = previewCanvasRef?.current;
      if (!previewCanvas || !startPointRef.current) return;

      clearPreview();

      const ctx = getContext(previewCanvas);
      if (!ctx) return;

      let endPoint = point;
      let rect: Rectangle;

      isShiftHeldRef.current = shiftHeld;
      isAltHeldRef.current = altHeld;

      if (activeTool === "line") {
        // Line tool
        if (shiftHeld) {
          endPoint = constrainAngle(startPointRef.current, point);
        }
        drawLine(ctx, startPointRef.current, endPoint, brushColor, shapeOptions.strokeWidth, brushOpacity);
      } else {
        // Rectangle or Ellipse
        if (shiftHeld) {
          endPoint = constrainToSquare(startPointRef.current, point);
        }

        if (altHeld) {
          rect = rectFromCenter(startPointRef.current, endPoint);
        } else {
          rect = calculateRect(startPointRef.current, endPoint);
        }

        const drawFn = activeTool === "rectangle" ? drawRectangle : drawEllipse;

        if (shapeOptions.fill) {
          drawFn(ctx, rect, brushColor, true, shapeOptions.strokeWidth, brushOpacity);
        }
        if (shapeOptions.stroke && !shapeOptions.fill) {
          drawFn(ctx, rect, brushColor, false, shapeOptions.strokeWidth, brushOpacity);
        }
      }
    },
    [previewCanvasRef, clearPreview, getContext, activeTool, brushColor, brushOpacity, shapeOptions]
  );

  /**
   * End drawing a shape
   */
  const endShape = useCallback(
    (point: Point) => {
      if (!canvas || !startPointRef.current) return;

      const ctx = getContext();
      if (!ctx) return;

      clearPreview();

      let endPoint = point;
      let rect: Rectangle;

      if (activeTool === "line") {
        if (isShiftHeldRef.current) {
          endPoint = constrainAngle(startPointRef.current, point);
        }
        drawLine(ctx, startPointRef.current, endPoint, brushColor, shapeOptions.strokeWidth, brushOpacity);
      } else {
        if (isShiftHeldRef.current) {
          endPoint = constrainToSquare(startPointRef.current, point);
        }

        if (isAltHeldRef.current) {
          rect = rectFromCenter(startPointRef.current, endPoint);
        } else {
          rect = calculateRect(startPointRef.current, endPoint);
        }

        const drawFn = activeTool === "rectangle" ? drawRectangle : drawEllipse;

        if (shapeOptions.fill) {
          drawFn(ctx, rect, brushColor, true, shapeOptions.strokeWidth, brushOpacity);
        }
        if (shapeOptions.stroke && !shapeOptions.fill) {
          drawFn(ctx, rect, brushColor, false, shapeOptions.strokeWidth, brushOpacity);
        }
      }

      setIsDrawing(false);
      commitOperation(canvas, "shape");
      startPointRef.current = null;
    },
    [canvas, clearPreview, getContext, activeTool, brushColor, brushOpacity, shapeOptions, setIsDrawing, commitOperation]
  );

  /**
   * Fill at a point
   */
  const fill = useCallback(
    (point: Point) => {
      if (!canvas) return;

      saveBeforeOperation(canvas);

      const ctx = getContext();
      if (!ctx) return;

      const fillColor = hexToRgba(brushColor, brushOpacity);
      fillAtPoint(ctx, Math.floor(point.x), Math.floor(point.y), fillColor, 32);

      commitOperation(canvas, "fill");
    },
    [canvas, saveBeforeOperation, getContext, brushColor, brushOpacity, commitOperation]
  );

  /**
   * Pick color at a point (eyedropper)
   */
  const pickColor = useCallback(
    (point: Point) => {
      if (!canvas) return;

      const ctx = getContext();
      if (!ctx) return;

      const pixel = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1);
      const [r, g, b] = pixel.data;

      const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      setBrushColor(hex);
    },
    [canvas, getContext, setBrushColor]
  );

  /**
   * Main draw start handler
   */
  const startDrawing = useCallback(
    (point: Point, pressure: number) => {
      switch (activeTool) {
        case "brush":
          startBrushStroke(point, pressure);
          break;
        case "eraser":
          startErasing(point, pressure);
          break;
        case "line":
        case "rectangle":
        case "ellipse":
          startShape(point);
          break;
        case "fill":
          fill(point);
          break;
        case "eyedropper":
          pickColor(point);
          break;
      }
    },
    [activeTool, startBrushStroke, startErasing, startShape, fill, pickColor]
  );

  /**
   * Main draw move handler
   */
  const continueDrawing = useCallback(
    (point: Point, pressure: number, shiftHeld: boolean = false, altHeld: boolean = false) => {
      switch (activeTool) {
        case "brush":
          continueBrushStroke(point, pressure);
          break;
        case "eraser":
          continueErasing(point, pressure);
          break;
        case "line":
        case "rectangle":
        case "ellipse":
          previewShape(point, shiftHeld, altHeld);
          break;
        case "eyedropper":
          pickColor(point);
          break;
      }
    },
    [activeTool, continueBrushStroke, continueErasing, previewShape, pickColor]
  );

  /**
   * Main draw end handler
   */
  const endDrawing = useCallback(
    (point?: Point) => {
      switch (activeTool) {
        case "brush":
          endBrushStroke();
          break;
        case "eraser":
          endErasing();
          break;
        case "line":
        case "rectangle":
        case "ellipse":
          if (point) {
            endShape(point);
          }
          break;
      }
    },
    [activeTool, endBrushStroke, endErasing, endShape]
  );

  return {
    startDrawing,
    continueDrawing,
    endDrawing,
    clearPreview,
  };
}
