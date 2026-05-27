import { useProjectStore } from "@/store/projectStore";

/**
 * Mark the current cloud project as having unsaved changes.
 * No-op when no project is open (local-only editing).
 */
export function markDocumentDirty(): void {
  const { currentProjectId } = useProjectStore.getState();
  if (currentProjectId) {
    useProjectStore.getState().markDirty();
  }
}
