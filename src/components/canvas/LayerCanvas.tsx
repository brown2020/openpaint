"use client";

import { useRef, useEffect } from "react";
import { useLayers } from "@/hooks/useLayers";
import { useProjects } from "@/hooks/useProjects";
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
  const loadedRef = useRef<boolean>(false);
  const { registerLayerCanvas, unregisterLayerCanvas } = useLayers();
  const { pendingLayerLoads, loadPendingLayerImage } = useProjects();

  // Register canvas with the store
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    registerLayerCanvas(layerId, canvas);

    return () => {
      unregisterLayerCanvas(layerId);
    };
  }, [layerId, registerLayerCanvas, unregisterLayerCanvas]);

  // Load pending image when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Only try to load once per mount
    if (loadedRef.current) return;

    const storageRef = pendingLayerLoads[layerId];
    if (storageRef) {
      loadedRef.current = true;
      loadPendingLayerImage(layerId, canvas);
    }
  }, [layerId, pendingLayerLoads, loadPendingLayerImage]);

  // Reset loaded flag when layerId changes
  useEffect(() => {
    loadedRef.current = false;
  }, [layerId]);

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
