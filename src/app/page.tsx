"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useLayers } from "@/hooks/useLayers";
import { useHistory } from "@/hooks/useHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProjects } from "@/hooks/useProjects";
import { useAutoSave } from "@/hooks/useAutoSave";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ToolPanel } from "@/components/toolbar/ToolPanel";
import { ColorPicker } from "@/components/toolbar/ColorPicker";
import { BrushSettings } from "@/components/toolbar/BrushSettings";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { StatusBar } from "@/components/panels/StatusBar";
import { AuthModal } from "@/components/auth/AuthModal";
import { ProjectListModal, NewProjectDialog } from "@/components/projects";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { isFirebaseConfigured } from "@/lib/firebase/auth";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, initialized: authInitialized } = useAuthStore();
  const { currentProjectId, currentProjectName } = useProjectStore();
  const { canvasSize, newProject } = useCanvasStore();
  const { layers, addLayer, getLayerCanvas, compositeToCanvas } = useLayers();
  const { canUndo, canRedo } = useHistory();
  const { saveProject, createNewProject } = useProjects();

  // Initialize auto-save
  useAutoSave({ enabled: !!user && !!currentProjectId });

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  // Show project picker after auth
  useEffect(() => {
    if (authInitialized && user && !currentProjectId) {
      setShowProjectList(true);
    }
  }, [authInitialized, user, currentProjectId]);

  // Show auth modal if not authenticated (only if Firebase is configured)
  useEffect(() => {
    if (authInitialized && !user && isFirebaseConfigured) {
      setShowAuthModal(true);
    }
  }, [authInitialized, user]);

  // Handle undo
  const handleUndo = useCallback(() => {
    console.log("Undo");
  }, []);

  // Handle redo
  const handleRedo = useCallback(() => {
    console.log("Redo");
  }, []);

  // Handle save - now uses cloud save if authenticated
  const handleSave = useCallback(async () => {
    if (user && currentProjectId) {
      await saveProject();
    } else {
      // Fallback to localStorage
      try {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvasSize.width;
        tempCanvas.height = canvasSize.height;
        compositeToCanvas(tempCanvas);

        const projectData = {
          version: "1.0.0",
          name: currentProjectName || "Untitled",
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
        alert("Project saved locally!");
      } catch (error) {
        console.error("Failed to save project:", error);
        alert("Failed to save project");
      }
    }
  }, [user, currentProjectId, saveProject, canvasSize, layers, getLayerCanvas, compositeToCanvas, currentProjectName]);

  // Handle export
  const handleExport = useCallback(() => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    compositeToCanvas(tempCanvas);

    const link = document.createElement("a");
    link.download = `${currentProjectName || "openpaint-artwork"}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [canvasSize, compositeToCanvas, currentProjectName]);

  // Handle new project
  const handleNew = useCallback(() => {
    if (user) {
      setShowNewProjectDialog(true);
    } else {
      if (confirm("Create a new project? Unsaved changes will be lost.")) {
        newProject();
      }
    }
  }, [user, newProject]);

  // Handle open file/project
  const handleOpen = useCallback(() => {
    if (user) {
      setShowProjectList(true);
    } else {
      fileInputRef.current?.click();
    }
  }, [user]);

  // Handle file selection (for local files)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          newProject({ width: img.width, height: img.height });

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

      e.target.value = "";
    },
    [newProject, getLayerCanvas, layers]
  );

  // Handle create new project
  const handleCreateProject = useCallback(async (name: string, size: { width: number; height: number }) => {
    await createNewProject(name, size);
    setShowNewProjectDialog(false);
  }, [createNewProject]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSave,
    onExport: handleExport,
    onNewLayer: addLayer,
  });

  // Show loading while auth is initializing
  if (!authInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading OpenPaint...</p>
        </div>
      </div>
    );
  }

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal && !user}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          setShowProjectList(true);
        }}
        closable={false}
      />

      {/* Project List Modal */}
      <ProjectListModal
        isOpen={showProjectList && !!user}
        onClose={() => setShowProjectList(false)}
        closable={!!currentProjectId}
      />

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
