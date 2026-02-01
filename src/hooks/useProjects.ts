"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import {
  createProject as createProjectInFirestore,
  getUserProjects,
  getProject,
  updateProject as updateProjectInFirestore,
  deleteProject as deleteProjectFromFirestore,
  renameProject as renameProjectInFirestore,
  type ProjectDocument,
  type LayerMetadata,
} from "@/lib/firebase/firestore";
import {
  uploadLayerImage,
  uploadThumbnail,
  downloadLayerImage,
  deleteProjectFiles,
  canvasToBlob,
  loadImageToCanvas,
} from "@/lib/firebase/storage";
import type { Size, Layer } from "@/types";

/**
 * Hook for managing cloud projects
 */
export function useProjects() {
  const { user } = useAuthStore();
  const {
    projects,
    currentProjectId,
    currentProjectName,
    syncStatus,
    lastSyncTime,
    isDirty,
    pendingLayerLoads,
    setProjects,
    addProject,
    removeProject,
    updateProjectInList,
    setCurrentProject,
    setLoading,
    setError,
    setSyncStatus,
    setLastSyncTime,
    markDirty,
    clearDirty,
    setPendingLayerLoads,
    clearPendingLayerLoad,
  } = useProjectStore();

  const canvasStore = useCanvasStore();

  /**
   * Fetch all projects for the current user
   */
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userProjects = await getUserProjects(user.uid);
      setProjects(userProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setError("Failed to load projects. Please try again.");
    }
  }, [user, setLoading, setError, setProjects]);

  /**
   * Create a new project
   */
  const createNewProject = useCallback(
    async (name: string, size: Size) => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        // Create default layer
        const defaultLayer: LayerMetadata = {
          id: crypto.randomUUID(),
          name: "Layer 1",
          visible: true,
          opacity: 1,
          locked: false,
          blendMode: "source-over",
          storageRef: "", // Will be set when saved
        };

        // Create project in Firestore
        const projectId = await createProjectInFirestore(user.uid, {
          name,
          canvasSize: size,
          layers: [defaultLayer],
          activeLayerId: defaultLayer.id,
        });

        // Get the created project
        const project = await getProject(projectId);
        if (project) {
          addProject(project);
          setCurrentProject(projectId, name);

          // Initialize canvas with new project
          canvasStore.newProject(size);
        }

        setLoading(false);
        return projectId;
      } catch (error) {
        console.error("Failed to create project:", error);
        setError("Failed to create project. Please try again.");
        return null;
      }
    },
    [user, setLoading, setError, addProject, setCurrentProject, canvasStore]
  );

  /**
   * Load a project from cloud storage
   */
  const loadProject = useCallback(
    async (projectId: string) => {
      if (!user) return false;

      setLoading(true);
      setError(null);
      setSyncStatus("syncing");

      try {
        // Get project metadata
        const project = await getProject(projectId);
        if (!project || project.userId !== user.uid) {
          setError("Project not found or access denied.");
          setLoading(false);
          return false;
        }

        // Create layer objects from project metadata
        const newLayers: Layer[] = project.layers.map((layerMeta) => ({
          id: layerMeta.id,
          name: layerMeta.name,
          visible: layerMeta.visible,
          opacity: layerMeta.opacity,
          locked: layerMeta.locked,
          blendMode: layerMeta.blendMode as Layer["blendMode"],
        }));

        // Collect layer storage refs for pending loads
        const layerRefs: Record<string, string> = {};
        project.layers.forEach((layer) => {
          if (layer.storageRef) {
            layerRefs[layer.id] = layer.storageRef;
          }
        });

        // Set pending layer loads - these will be loaded when canvases register
        setPendingLayerLoads(layerRefs);

        // Set current project
        setCurrentProject(projectId, project.name);

        // Load project layers into canvas store (this resets layerCanvases)
        canvasStore.loadProjectLayers(
          project.canvasSize,
          newLayers,
          project.activeLayerId
        );

        setSyncStatus("synced");
        setLastSyncTime(Date.now());
        clearDirty();
        setLoading(false);

        return true;
      } catch (error) {
        console.error("Failed to load project:", error);
        setError("Failed to load project. Please try again.");
        setSyncStatus("error");
        setLoading(false);
        return false;
      }
    },
    [
      user,
      setLoading,
      setError,
      setSyncStatus,
      setLastSyncTime,
      setCurrentProject,
      clearDirty,
      setPendingLayerLoads,
      canvasStore,
    ]
  );

  /**
   * Save current project to cloud
   */
  const saveProject = useCallback(async () => {
    if (!user || !currentProjectId) return false;

    setSyncStatus("syncing");
    setError(null);

    try {
      const { layers, activeLayerId, canvasSize, layerCanvases } =
        canvasStore;

      // Upload layer images
      const layerMetadata: LayerMetadata[] = [];

      for (const layer of layers) {
        const canvas = layerCanvases.get(layer.id);
        if (canvas) {
          const blob = await canvasToBlob(canvas);
          const storageRef = await uploadLayerImage(
            user.uid,
            currentProjectId,
            layer.id,
            blob
          );

          layerMetadata.push({
            id: layer.id,
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            locked: layer.locked,
            blendMode: layer.blendMode,
            storageRef,
          });
        }
      }

      // Generate and upload thumbnail
      const thumbnailCanvas = document.createElement("canvas");
      const thumbSize = 200;
      thumbnailCanvas.width = thumbSize;
      thumbnailCanvas.height = thumbSize;
      const thumbCtx = thumbnailCanvas.getContext("2d");

      if (thumbCtx) {
        // Fill with white background
        thumbCtx.fillStyle = "#ffffff";
        thumbCtx.fillRect(0, 0, thumbSize, thumbSize);

        // Calculate aspect ratio
        const aspectRatio = canvasSize.width / canvasSize.height;
        let drawWidth = thumbSize;
        let drawHeight = thumbSize;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > 1) {
          drawHeight = thumbSize / aspectRatio;
          offsetY = (thumbSize - drawHeight) / 2;
        } else {
          drawWidth = thumbSize * aspectRatio;
          offsetX = (thumbSize - drawWidth) / 2;
        }

        // Draw all visible layers
        for (const layer of layers) {
          if (layer.visible) {
            const canvas = layerCanvases.get(layer.id);
            if (canvas) {
              thumbCtx.globalAlpha = layer.opacity;
              thumbCtx.drawImage(
                canvas,
                offsetX,
                offsetY,
                drawWidth,
                drawHeight
              );
            }
          }
        }
        thumbCtx.globalAlpha = 1;

        const thumbBlob = await canvasToBlob(thumbnailCanvas);
        const thumbnailUrl = await uploadThumbnail(
          user.uid,
          currentProjectId,
          thumbBlob
        );

        // Update Firestore
        await updateProjectInFirestore(currentProjectId, {
          layers: layerMetadata,
          activeLayerId,
          thumbnailUrl,
        });

        // Update local project list
        updateProjectInList(currentProjectId, {
          layers: layerMetadata,
          activeLayerId,
          thumbnailUrl,
        });
      }

      setSyncStatus("synced");
      setLastSyncTime(Date.now());
      clearDirty();

      return true;
    } catch (error) {
      console.error("Failed to save project:", error);
      setError("Failed to save project. Please try again.");
      setSyncStatus("error");
      return false;
    }
  }, [
    user,
    currentProjectId,
    canvasStore,
    setSyncStatus,
    setError,
    setLastSyncTime,
    clearDirty,
    updateProjectInList,
  ]);

  /**
   * Delete a project
   */
  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user) return false;

      setLoading(true);
      setError(null);

      try {
        // Delete from Firestore
        await deleteProjectFromFirestore(projectId);

        // Delete storage files
        await deleteProjectFiles(user.uid, projectId);

        // Remove from local list
        removeProject(projectId);

        // If deleted current project, clear it
        if (currentProjectId === projectId) {
          setCurrentProject(null, null);
        }

        setLoading(false);
        return true;
      } catch (error) {
        console.error("Failed to delete project:", error);
        setError("Failed to delete project. Please try again.");
        return false;
      }
    },
    [user, currentProjectId, setLoading, setError, removeProject, setCurrentProject]
  );

  /**
   * Rename a project
   */
  const renameProject = useCallback(
    async (projectId: string, newName: string) => {
      if (!user) return false;

      setError(null);

      try {
        await renameProjectInFirestore(projectId, newName);
        updateProjectInList(projectId, { name: newName });

        if (currentProjectId === projectId) {
          setCurrentProject(projectId, newName);
        }

        return true;
      } catch (error) {
        console.error("Failed to rename project:", error);
        setError("Failed to rename project. Please try again.");
        return false;
      }
    },
    [user, currentProjectId, setError, updateProjectInList, setCurrentProject]
  );

  /**
   * Load layer images into canvases
   */
  const loadLayerImages = useCallback(
    async (layerRefs: Map<string, string>) => {
      const { layerCanvases } = canvasStore;

      for (const [layerId, storageRef] of layerRefs) {
        const canvas = layerCanvases.get(layerId);
        if (canvas && storageRef) {
          try {
            const url = await downloadLayerImage(storageRef);
            await loadImageToCanvas(url, canvas);
          } catch (error) {
            console.error(`Failed to load layer ${layerId}:`, error);
          }
        }
      }
    },
    [canvasStore]
  );

  /**
   * Load a single layer image when its canvas becomes available
   */
  const loadPendingLayerImage = useCallback(
    async (layerId: string, canvas: HTMLCanvasElement) => {
      const storageRef = pendingLayerLoads[layerId];
      if (!storageRef) return;

      try {
        const url = await downloadLayerImage(storageRef);
        await loadImageToCanvas(url, canvas);
        clearPendingLayerLoad(layerId);
      } catch (error) {
        console.error(`Failed to load layer ${layerId}:`, error);
        // Still clear the pending load to prevent infinite retries
        clearPendingLayerLoad(layerId);
        // Set a user-friendly error message
        if (error instanceof Error && error.message.includes("CORS")) {
          setError(
            "Failed to load project images. Firebase Storage CORS may not be configured. " +
            "Please check the console for configuration details."
          );
        }
      }
    },
    [pendingLayerLoads, clearPendingLayerLoad, setError]
  );

  return {
    // State
    projects,
    currentProjectId,
    currentProjectName,
    syncStatus,
    lastSyncTime,
    isDirty,
    pendingLayerLoads,

    // Actions
    fetchProjects,
    createNewProject,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    loadLayerImages,
    loadPendingLayerImage,
    markDirty,
  };
}
