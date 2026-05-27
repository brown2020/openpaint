import { create } from "zustand";
import type { ProjectDocument } from "@/lib/firebase/firestore";

export type SyncStatus = "synced" | "syncing" | "error" | "offline";

interface ProjectState {
  // Projects list
  projects: ProjectDocument[];
  loading: boolean;
  error: string | null;

  // Current project
  currentProjectId: string | null;
  currentProjectName: string | null;

  // Sync status
  syncStatus: SyncStatus;
  lastSyncTime: number | null;
  isDirty: boolean;

  // Actions
  setProjects: (projects: ProjectDocument[]) => void;
  addProject: (project: ProjectDocument) => void;
  removeProject: (projectId: string) => void;
  updateProjectInList: (
    projectId: string,
    updates: Partial<ProjectDocument>
  ) => void;

  setCurrentProject: (projectId: string | null, name: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setSyncStatus: (status: SyncStatus) => void;
  setLastSyncTime: (time: number | null) => void;
  markDirty: () => void;
  clearDirty: () => void;

  clearError: () => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  loading: false,
  error: null,
  currentProjectId: null,
  currentProjectName: null,
  syncStatus: "synced" as SyncStatus,
  lastSyncTime: null,
  isDirty: false,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  // Projects list actions
  setProjects: (projects) => set({ projects, loading: false }),

  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),

  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      // Clear current project if deleted
      ...(state.currentProjectId === projectId
        ? { currentProjectId: null, currentProjectName: null }
        : {}),
    })),

  updateProjectInList: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
      // Update current project name if applicable
      ...(state.currentProjectId === projectId && updates.name
        ? { currentProjectName: updates.name }
        : {}),
    })),

  // Current project actions
  setCurrentProject: (projectId, name) =>
    set({
      currentProjectId: projectId,
      currentProjectName: name,
      isDirty: false,
    }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  // Sync status actions
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),
  markDirty: () => set({ isDirty: true }),
  clearDirty: () => set({ isDirty: false }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
