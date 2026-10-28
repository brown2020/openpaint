import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import { useProjectStore } from "@/store/projectStore";

/**
 * True when the signed-in account changed or signed out.
 * Guest sign-in (null → uid) keeps the in-progress local drawing.
 */
export function shouldResetEditorOnAuthChange(
  previousUserId: string | null,
  nextUserId: string | null,
): boolean {
  if (previousUserId == null) return false;
  return previousUserId !== nextUserId;
}

/** Drop cloud project binding and the in-memory document. */
export function resetEditorSession(): void {
  useProjectStore.getState().reset();
  useDocumentStore.getState().newDocument();
  useCanvasStore.getState().newProject();
}
