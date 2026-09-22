"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useProjects } from "@/hooks/useProjects";
import { useAutoSave } from "@/hooks/useAutoSave";
import { renderScene } from "@/lib/vector/renderer";
import { downloadSvgFile, exportDocumentToSvg } from "@/lib/vector/svgExport";
import {
  getGuestBannerDismissed,
  setGuestBannerDismissed,
} from "@/components/auth";
import { isFirebaseConfigured } from "@/lib/firebase/auth";

type AuthIntent = "none" | "openProjects";

export function useHomeEditor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authIntentRef = useRef<AuthIntent>("none");
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

  useAutoSave({ enabled: !!user && !!currentProjectId });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [projectListOpen, setProjectListOpen] = useState(false);
  const showProjectList =
    !!user && (projectListOpen || (authInitialized && !currentProjectId));
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);

  const storedBannerDismissed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => getGuestBannerDismissed(),
    () => false,
  );
  const effectivelyDismissed = bannerDismissed || storedBannerDismissed;

  const showGuestBanner =
    authInitialized && !user && isFirebaseConfigured && !effectivelyDismissed;

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
    authIntentRef.current = intent;
    setAuthModalOpen(true);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    const intent = authIntentRef.current;
    setAuthModalOpen(false);
    authIntentRef.current = "none";
    queueMicrotask(() => {
      if (useAuthStore.getState().user && intent === "openProjects") {
        setProjectListOpen(true);
      }
    });
  }, []);

  const handleDismissBanner = useCallback(() => {
    setGuestBannerDismissed();
    setBannerDismissed(true);
  }, []);

  const handleUndo = useCallback(() => {
    docUndo();
  }, [docUndo]);

  const handleRedo = useCallback(() => {
    docRedo();
  }, [docRedo]);

  const renderToCanvas = useCallback(() => {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvasSize.width;
    tempCanvas.height = canvasSize.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return tempCanvas;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const docLayers = useDocumentStore.getState().layers;
    renderScene(ctx, docLayers, canvasSize.width, canvasSize.height);

    return tempCanvas;
  }, [canvasSize]);

  const handleSave = useCallback(async () => {
    if (user && currentProjectId) {
      await saveProject();
    } else {
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

  const handleExportPng = useCallback(() => {
    const tempCanvas = renderToCanvas();
    const link = document.createElement("a");
    link.download = `${exportBaseName}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    link.click();
  }, [renderToCanvas, exportBaseName]);

  const handleExportSvg = useCallback(() => {
    const docLayers = useDocumentStore.getState().layers;
    const svg = exportDocumentToSvg(docLayers, {
      width: canvasSize.width,
      height: canvasSize.height,
    });
    downloadSvgFile(svg, exportBaseName);
  }, [canvasSize, exportBaseName]);

  const handleNew = useCallback(() => {
    if (user) {
      setShowNewProjectDialog(true);
    } else if (confirm("Create a new project? Unsaved changes will be lost.")) {
      newProject();
      newDocument();
    }
  }, [user, newProject, newDocument]);

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

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.version && data.layers) {
            newProject(data.canvasSize || { width: 800, height: 600 });
            newDocument();
            if (data.version.startsWith("2")) {
              useDocumentStore
                .getState()
                .loadDocument(data.layers, data.layers[0]?.id);
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

  const handleCreateProject = useCallback(
    async (name: string, size: { width: number; height: number }) => {
      await createNewProject(name, size);
      setShowNewProjectDialog(false);
    },
    [createNewProject],
  );

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: handleSave,
    onExport: handleExportPng,
    onExportSvg: handleExportSvg,
    onNewLayer: addVectorLayer,
  });

  return {
    fileInputRef,
    user,
    authInitialized,
    currentProjectId,
    authModalOpen,
    setAuthModalOpen,
    showGuestBanner,
    showProjectList,
    setProjectListOpen,
    showNewProjectDialog,
    setShowNewProjectDialog,
    openAuthModal,
    handleAuthSuccess,
    handleDismissBanner,
    handleUndo,
    handleRedo,
    handleSave,
    handleExportPng,
    handleExportSvg,
    handleNew,
    handleOpen,
    handleOpenCloudProjects,
    handleFileChange,
    handleCreateProject,
    docCanUndo,
    docCanRedo,
    isFirebaseConfigured,
  };
}
