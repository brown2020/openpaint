"use client";

import { useCallback, useRef } from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { useLayers } from "@/hooks/useLayers";
import { useHistory } from "@/hooks/useHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ToolPanel } from "@/components/toolbar/ToolPanel";
import { ColorPicker } from "@/components/toolbar/ColorPicker";
import { BrushSettings } from "@/components/toolbar/BrushSettings";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { StatusBar } from "@/components/panels/StatusBar";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canvasSize, newProject } = useCanvasStore();
  const { layers, addLayer, getLayerCanvas, compositeToCanvas } = useLayers();
  const { canUndo, canRedo } = useHistory();

  // Handle undo
  const handleUndo = useCallback(() => {
    // Undo is handled through the history hook
    // For now, we'll implement a simple version
    console.log("Undo");
  }, []);

  // Handle redo
  const handleRedo = useCallback(() => {
    console.log("Redo");
  }, []);

  // Handle save to localStorage
  const handleSave = useCallback(() => {
    try {
      // Create a composite of all layers
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvasSize.width;
      tempCanvas.height = canvasSize.height;
      compositeToCanvas(tempCanvas);

      const projectData = {
        version: "1.0.0",
        name: "Untitled",
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        canvasSize,
        layers: layers.map((layer) => {
          const layerCanvas = getLayerCanvas(layer.id);
          return {
            ...layer,
            data: layerCanvas ? layerCanvas.toDataURL("image/png") : "",
          };
        }),
      };

      localStorage.setItem("openpaint-project", JSON.stringify(projectData));
      alert("Project saved!");
    } catch (error) {
      console.error("Failed to save project:", error);
      alert("Failed to save project");
    }
  }, [canvasSize, layers, getLayerCanvas, compositeToCanvas]);

  // Handle export
  const handleExport = useCallback(() => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    compositeToCanvas(tempCanvas);

    const link = document.createElement("a");
    link.download = "openpaint-artwork.png";
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [canvasSize, compositeToCanvas]);

  // Handle new project
  const handleNew = useCallback(() => {
    if (confirm("Create a new project? Unsaved changes will be lost.")) {
      newProject();
    }
  }, [newProject]);

  // Handle open file
  const handleOpen = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Create new project with image dimensions
          newProject({ width: img.width, height: img.height });

          // Wait for canvas to be ready, then draw image
          setTimeout(() => {
            const canvas = getLayerCanvas(layers[0]?.id);
            if (canvas) {
              const ctx = canvas.getContext("2d");
              if (ctx) {
                ctx.drawImage(img, 0, 0);
              }
            }
          }, 100);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);

      // Reset input
      e.target.value = "";
    },
    [newProject, getLayerCanvas, layers]
  );

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSave,
    onExport: handleExport,
    onNewLayer: addLayer,
  });

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Top Toolbar */}
      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onSave={handleSave}
        onExport={handleExport}
        onNew={handleNew}
        onOpen={handleOpen}
      />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Tools */}
        <div className="w-16 flex flex-col gap-2 p-2 bg-gray-100 border-r border-gray-300">
          <ToolPanel />
        </div>

        {/* Left sidebar - Color & Brush */}
        <div className="w-48 flex flex-col gap-2 p-2 bg-gray-50 border-r border-gray-300 overflow-y-auto">
          <ColorPicker />
          <BrushSettings />
        </div>

        {/* Canvas area */}
        <CanvasContainer />

        {/* Right sidebar - Layers */}
        <div className="w-56 flex flex-col p-2 bg-gray-50 border-l border-gray-300">
          <LayersPanel />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
