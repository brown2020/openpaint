"use client";

import { useCallback, useRef, useEffect } from "react";
import type { Point } from "@/types";

interface CanvasEventHandlers {
  onDrawStart: (point: Point, pressure: number) => void;
  onDrawMove: (point: Point, pressure: number) => void;
  onDrawEnd: () => void;
}

interface UseCanvasEventsOptions {
  enabled?: boolean;
}

/**
 * Hook for handling canvas pointer/touch events
 * Uses Pointer Events API for unified mouse/touch/pen support
 */
export function useCanvasEvents(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  handlers: CanvasEventHandlers,
  options: UseCanvasEventsOptions = {}
) {
  const { enabled = true } = options;
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  /**
   * Get canvas-relative coordinates from a pointer event
   */
  const getCanvasPoint = useCallback(
    (e: PointerEvent | React.PointerEvent): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [canvasRef]
  );

  /**
   * Get pressure from pointer event (0.5 default for mouse)
   */
  const getPressure = useCallback((e: PointerEvent | React.PointerEvent): number => {
    // Mouse events report 0 pressure, use 0.5 as default
    if (e.pointerType === "mouse") {
      return e.buttons > 0 ? 0.5 : 0;
    }
    return e.pressure;
  }, []);

  /**
   * Handle pointer down event
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Capture pointer for tracking outside canvas
      canvas.setPointerCapture(e.pointerId);

      const point = getCanvasPoint(e);
      if (!point) return;

      isDrawingRef.current = true;
      lastPointRef.current = point;

      handlers.onDrawStart(point, getPressure(e));
    },
    [enabled, canvasRef, getCanvasPoint, getPressure, handlers]
  );

  /**
   * Handle pointer move event
   */
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const point = getCanvasPoint(e);
      if (!point) return;

      if (isDrawingRef.current) {
        handlers.onDrawMove(point, getPressure(e));
        lastPointRef.current = point;
      }
    },
    [enabled, getCanvasPoint, getPressure, handlers]
  );

  /**
   * Handle pointer up event
   */
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!enabled) return;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }

      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        lastPointRef.current = null;
        handlers.onDrawEnd();
      }
    },
    [enabled, canvasRef, handlers]
  );

  /**
   * Handle pointer leave event
   */
  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Only end drawing if we don't have pointer capture
      const canvas = canvasRef.current;
      if (canvas && !canvas.hasPointerCapture(e.pointerId)) {
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          lastPointRef.current = null;
          handlers.onDrawEnd();
        }
      }
    },
    [canvasRef, handlers]
  );

  /**
   * Prevent default touch behaviors
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefaults = (e: TouchEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("touchstart", preventDefaults, { passive: false });
    canvas.addEventListener("touchmove", preventDefaults, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventDefaults);
      canvas.removeEventListener("touchmove", preventDefaults);
    };
  }, [canvasRef]);

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
    },
    getCanvasPoint,
  };
}
