"use client";

import { useRef, useEffect, useCallback } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { DrawingCanvas } from "./DrawingCanvas";

/**
 * Canvas container with zoom and pan support
 */
export function CanvasContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { zoom, setZoom, pan, setPan } = useCanvasStore();

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(10, zoom * delta));
        setZoom(newZoom);
      }
    },
    [zoom, setZoom]
  );

  // Set up wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  // Handle middle mouse button pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        // Middle mouse button
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startPan = { ...pan };

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const dx = moveEvent.clientX - startX;
          const dy = moveEvent.clientY - startY;
          setPan({
            x: startPan.x + dx / zoom,
            y: startPan.y + dy / zoom,
          });
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    },
    [pan, setPan, zoom]
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden bg-gray-300"
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <DrawingCanvas />
    </div>
  );
}
