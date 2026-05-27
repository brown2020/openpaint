"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProjects } from "@/hooks/useProjects";
import { useAutoSave } from "@/hooks/useAutoSave";
import { renderScene } from "@/lib/vector/renderer";
import { downloadSvgFile, exportDocumentToSvg } from "@/lib/vector/svgExport";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ToolPanel } from "@/components/toolbar/ToolPanel";
import { ColorPicker } from "@/components/toolbar/ColorPicker";
import { BrushSettings } from "@/components/toolbar/BrushSettings";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { StatusBar } from "@/components/panels/StatusBar";
import {
  AuthModal,
  GuestSignInBanner,
  getGuestBannerDismissed,
  setGuestBannerDismissed,
} from "@/components/auth";
import { ProjectListModal, NewProjectDialog } from "@/components/projects";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { isFirebaseConfigured } from "@/lib/firebase/auth";

type AuthIntent = "none" | "openProjects";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, initialized: authInitialized } = useAuthStore();
  const { currentProjectId, currentProjectName } = useProjectStore();
  const { canvasSize, newProject } = useCanvasStore();
  const {
    undo: docUndo,
    redo: docRedo,
    canUndo: docCanUndo,
    canRedo: docCanRedo,
    newDocument,
    loadDocument,
    addLayer: addVectorLayer,
  } = useDocumentStore();
  const { saveProject, createNewProject } = useProjects();

  // Initialize auto-save
  useAutoSave({ enabled: !!user && !!currentProjectId });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState<AuthIntent>("none");
  const [bannerDismissed, setBannerDismissed] = useState(
    () => typeof window !== "undefined" && getGuestBannerDismissed(),
  );
  const [projectListOpen, setProjectListOpen] = useState(false);
  const showProjectList = !!user && (projectListOpen || (authInitialized && !currentProjectId));
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const showGuestBanner =
    authInitialized && !user && isFirebaseConfigured && !bannerDismissed;

  // Restore last local project for guests (optional instant resume)
  useEffect(() => {
    if (!authInitialized || user) return;

    try {
      const raw = localStorage.getItem("openpaint-project");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        version?: string;
        canvasSize?: { width: number; height: number };
        layers?: Parameters<typeof loadDocument>[0];
      };
      if (data.version?.startsWith("2") && data.layers?.length) {
        newProject(data.canvasSize ?? { width: 800, height: 600 });
        loadDocument(data.layers, data.layers[0].id);
      }
    } catch {
      // Ignore corrupt local saves
    }
  }, [authInitialized, user, newProject, loadDocument]);

  const openAuthModal = useCallback((intent: AuthIntent = "none") => {
    setAuthIntent(intent);
    setAuthModalOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    const intent = authIntent;
    setAuthModalOpen(false);
    setAuthIntent("none");
    // Defer until Firebase auth state has propagated
    queueMicrotask(() => {
      if (useAuthStore.getState().user && intent === "openProjects") {
        setProjectListOpen(true);
      }
    });
  }, [authIntent]);

  const handleDismissBanner = useCallback(() => {
    setGuestBannerDismissed();
    setBannerDismissed(true);
  }, []);

  // Handle undo/redo — uses the vector document store
  const handleUndo = useCallback(() => {
    docUndo();
  }, [docUndo]);

  const handleRedo = useCallback(() => {
    docRedo();
  }, [docRedo]);

  // Render vector scene to a temp canvas (used for export & local save)
  const renderToCanvas = useCallback(() => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return tempCanvas;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Render all vector layers
    const docLayers = useDocumentStore.getState().layers;
    renderScene(ctx, docLayers, canvasSize.width, canvasSize.height);

    return tempCanvas;
  }, [canvasSize]);

  // Handle save - now uses cloud save if authenticated
  const handleSave = useCallback(async () => {
    if (user && currentProjectId) {
      await saveProject();
    } else {
      // Fallback to localStorage
      try {
        const docLayers = useDocumentStore.getState().layers;
        const projectData = {
          version: "2.0.0",
          name: currentProjectName || "Untitled",
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          canvasSize,
          layers: docLayers,
        };

        localStorage.setItem("openpaint-project", JSON.stringify(projectData));
        alert("Project saved locally!");
      } catch (error) {
        console.error("Failed to save project:", error);
        alert("Failed to save project");
      }
    }
  }, [user, currentProjectId, saveProject, canvasSize, currentProjectName]);

  const exportBaseName = currentProjectName || "openpaint-artwork";

  // Export PNG — rasterized composite
  const handleExportPng = useCallback(() => {
    const tempCanvas = renderToCanvas();
    const link = document.createElement("a");
    link.download = `${exportBaseName}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [renderToCanvas, exportBaseName]);

  // Export SVG — vector scene graph
  const handleExportSvg = useCallback(() => {
    const docLayers = useDocumentStore.getState().layers;
    const svg = exportDocumentToSvg(docLayers, {
      width: canvasSize.width,
      height: canvasSize.height,
    });
    downloadSvgFile(svg, exportBaseName);
  }, [canvasSize, exportBaseName]);

  // Handle new project
  const handleNew = useCallback(() => {
    if (user) {
      setShowNewProjectDialog(true);
    } else if (confirm("Create a new project? Unsaved changes will be lost.")) {
      newProject();
      newDocument();
    }
  }, [user, newProject, newDocument]);

  // Handle open file/project
  const handleOpen = useCallback(() => {
    if (user) {
      setProjectListOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  }, [user]);

  const handleOpenCloudProjects = useCallback(() => {
    if (user) {
      setProjectListOpen(true);
    } else if (isFirebaseConfigured) {
      openAuthModal("openProjects");
    }
  }, [user, openAuthModal]);

  // Handle file selection (for local project files)
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Try to load as JSON project file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.version && data.layers) {
            newProject(data.canvasSize || { width: 800, height: 600 });
            newDocument();
            // If it's a v2 project with vector layers, load them
            if (data.version.startsWith("2")) {
              useDocumentStore.getState().loadDocument(data.layers, data.layers[0]?.id);
            }
          }
        } catch {
          alert("Could not load project file.");
        }
      };
      reader.readAsText(file);

      e.target.value = "";
    },
    [newProject, newDocument],
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
    onExport: handleExportPng,
    onExportSvg: handleExportSvg,
    onNewLayer: addVectorLayer,
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
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
      />

      {showGuestBanner && (
        <GuestSignInBanner
          onSignIn={() => openAuthModal()}
          onOpenCloudProjects={handleOpenCloudProjects}
          dismissed={false}
          onDismiss={handleDismissBanner}
        />
      )}

      {/* Top Toolbar */}
      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={docCanUndo()}
        canRedo={docCanRedo()}
        onSave={handleSave}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onNew={handleNew}
        onOpen={handleOpen}
        onSignIn={!user && isFirebaseConfigured ? () => openAuthModal() : undefined}
        saveTitle={
          user
            ? "Save to cloud (Ctrl+S)"
            : isFirebaseConfigured
              ? "Save locally (Ctrl+S)"
              : "Save (Ctrl+S)"
        }
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

        {/* Right sidebar - Properties + Layers */}
        <div className="w-56 flex flex-col bg-gray-50 border-l border-gray-300 overflow-y-auto">
          <div className="border-b border-gray-300">
            <PropertiesPanel />
          </div>
          <div className="p-2 flex-1">
            <LayersPanel />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Auth Modal — only when user requests cloud features */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthIntent("none");
        }}
        onSuccess={handleAuthSuccess}
        closable
      />

      {/* Project List Modal */}
      <ProjectListModal
        isOpen={showProjectList}
        onClose={() => setProjectListOpen(false)}
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
