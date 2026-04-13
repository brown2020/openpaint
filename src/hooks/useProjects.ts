"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import {
  createProject as createProjectInFirestore,
  getUserProjects,
  getProject,
  updateProject as updateProjectInFirestore,
  deleteProject as deleteProjectFromFirestore,
  renameProject as renameProjectInFirestore,
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
import { renderScene } from "@/lib/vector/renderer";
import { createLayer as createVectorLayer, type VectorLayer } from "@/types/vector";
import type { Size } from "@/types";

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
    clearPendingLayerLoad,
  } = useProjectStore();

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

  const createNewProject = useCallback(
    async (name: string, size: Size) => {
      if (!user) return null;

      setLoading(true);
      setError(null);

      try {
        const defaultLayer: LayerMetadata = {
          id: crypto.randomUUID(),
          name: "Layer 1",
          visible: true,
          opacity: 1,
          locked: false,
          blendMode: "source-over",
          storageRef: "",
        };

        const projectId = await createProjectInFirestore(user.uid, {
          name,
          canvasSize: size,
          layers: [defaultLayer],
          activeLayerId: defaultLayer.id,
        });

        const project = await getProject(projectId);
        if (project) {
          addProject(project);
          setCurrentProject(projectId, name);
          useCanvasStore.getState().newProject(size);
          useDocumentStore.getState().newDocument(size.width, size.height);
        }

        setLoading(false);
        return projectId;
      } catch (error) {
        console.error("Failed to create project:", error);
        setError("Failed to create project. Please try again.");
        return null;
      }
    },
    [user, setLoading, setError, addProject, setCurrentProject]
  );

  const loadProject = useCallback(
    async (projectId: string) => {
      if (!user) return false;

      setLoading(true);
      setError(null);
      setSyncStatus("syncing");

      try {
        const project = await getProject(projectId);
        if (!project || project.userId !== user.uid) {
          setError("Project not found or access denied.");
          setLoading(false);
          return false;
        }

        let vectorLayers: VectorLayer[];

        if (project.vectorLayers && Array.isArray(project.vectorLayers) && project.vectorLayers.length > 0) {
          vectorLayers = project.vectorLayers as VectorLayer[];
        } else {
          vectorLayers = project.layers.map((layerMeta) => {
            const vl = createVectorLayer(layerMeta.id, layerMeta.name);
            vl.visible = layerMeta.visible;
            vl.locked = layerMeta.locked;
            vl.opacity = layerMeta.opacity;
            return vl;
          });
        }

        setCurrentProject(projectId, project.name);

        useCanvasStore.getState().setCanvasSize(project.canvasSize);
        useDocumentStore.getState().loadDocument(
          vectorLayers,
          project.activeLayerId || vectorLayers[0]?.id
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
    ]
  );

  const saveProject = useCallback(async () => {
    if (!user || !currentProjectId) return false;

    setSyncStatus("syncing");
    setError(null);

    try {
      const { canvasSize } = useCanvasStore.getState();
      const docState = useDocumentStore.getState();
      const docLayers = docState.layers;
      const activeLayerId = docState.activeLayerId;

      const layerMetadata: LayerMetadata[] = [];

      for (const layer of docLayers) {
        const layerCanvas = document.createElement("canvas");
        layerCanvas.width = canvasSize.width;
        layerCanvas.height = canvasSize.height;
        const layerCtx = layerCanvas.getContext("2d");
        if (!layerCtx) continue;

        renderScene(layerCtx, [{ ...layer, visible: true }], canvasSize.width, canvasSize.height);

        const blob = await canvasToBlob(layerCanvas);
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
          blendMode: "source-over",
          storageRef,
        });
      }

      let thumbnailUrl: string | null = null;
      try {
        const thumbnailCanvas = document.createElement("canvas");
        const thumbSize = 200;
        thumbnailCanvas.width = thumbSize;
        thumbnailCanvas.height = thumbSize;
        const thumbCtx = thumbnailCanvas.getContext("2d");

        if (thumbCtx) {
          thumbCtx.fillStyle = "#ffffff";
          thumbCtx.fillRect(0, 0, thumbSize, thumbSize);

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

          const fullCanvas = document.createElement("canvas");
          fullCanvas.width = canvasSize.width;
          fullCanvas.height = canvasSize.height;
          const fullCtx = fullCanvas.getContext("2d");
          if (fullCtx) {
            renderScene(fullCtx, docLayers, canvasSize.width, canvasSize.height);
            thumbCtx.drawImage(fullCanvas, offsetX, offsetY, drawWidth, drawHeight);
          }

          const thumbBlob = await canvasToBlob(thumbnailCanvas);
          thumbnailUrl = await uploadThumbnail(
            user.uid,
            currentProjectId,
            thumbBlob
          );
        }
      } catch (thumbError) {
        console.error("Failed to generate thumbnail:", thumbError);
      }

      const serializedLayers = JSON.parse(JSON.stringify(docLayers));

      await updateProjectInFirestore(currentProjectId, {
        layers: layerMetadata,
        activeLayerId,
        thumbnailUrl,
        vectorLayers: serializedLayers,
      });

      updateProjectInList(currentProjectId, {
        layers: layerMetadata,
        activeLayerId,
        thumbnailUrl,
      });

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
    setSyncStatus,
    setError,
    setLastSyncTime,
    clearDirty,
    updateProjectInList,
  ]);

  const deleteProject = useCallback(
    async (projectId: string) => {
      if (!user) return false;

      setLoading(true);
      setError(null);

      try {
        await deleteProjectFromFirestore(projectId);
        await deleteProjectFiles(user.uid, projectId);
        removeProject(projectId);

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
        clearPendingLayerLoad(layerId);
        if (error instanceof Error && error.message.includes("CORS")) {
          setError(
            "Failed to load project images. Firebase Storage CORS may not be configured for your domain."
          );
        }
      }
    },
    [pendingLayerLoads, clearPendingLayerLoad, setError]
  );

  return {
    projects,
    currentProjectId,
    currentProjectName,
    syncStatus,
    lastSyncTime,
    isDirty,
    pendingLayerLoads,
    fetchProjects,
    createNewProject,
    loadProject,
    saveProject,
    deleteProject,
    renameProject,
    loadPendingLayerImage,
    markDirty,
  };
}
