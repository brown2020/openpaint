"use client";

import { useRef, useEffect } from "react";
import { useLayers } from "@/hooks/useLayers";
import type { Size } from "@/types";

interface LayerCanvasProps {
  layerId: string;
  size: Size;
  visible: boolean;
  opacity: number;
}

/**
 * Individual layer canvas component
 * Each layer has its own canvas element for independent drawing
 */
export function LayerCanvas({ layerId, size, visible, opacity }: LayerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { registerLayerCanvas, unregisterLayerCanvas } = useLayers();

  // Register canvas with the store
  useEffect(() => {
    if (canvasRef.current) {
      registerLayerCanvas(layerId, canvasRef.current);
    }

    return () => {
      unregisterLayerCanvas(layerId);
    };
  }, [layerId, registerLayerCanvas, unregisterLayerCanvas]);

  // Initialize canvas with transparent background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear to transparent
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [size.width, size.height]);

  return (
    <canvas
      ref={canvasRef}
      width={size.width}
      height={size.height}
      className="absolute top-0 left-0"
      style={{
        display: visible ? "block" : "none",
        opacity,
        pointerEvents: "none", // Let events pass through to the event layer
      }}
    />
  );
}
