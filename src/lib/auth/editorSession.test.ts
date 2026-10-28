import { beforeEach, describe, expect, it } from "vitest";
import { useCanvasStore } from "@/store/canvasStore";
import { useDocumentStore } from "@/store/documentStore";
import { useProjectStore } from "@/store/projectStore";
import {
  resetEditorSession,
  shouldResetEditorOnAuthChange,
} from "./editorSession";

describe("shouldResetEditorOnAuthChange", () => {
  it("resets on sign-out and on account switch", () => {
    expect(shouldResetEditorOnAuthChange("user-a", null)).toBe(true);
    expect(shouldResetEditorOnAuthChange("user-a", "user-b")).toBe(true);
  });

  it("keeps the guest document when someone signs in", () => {
    expect(shouldResetEditorOnAuthChange(null, "user-a")).toBe(false);
    expect(shouldResetEditorOnAuthChange(null, null)).toBe(false);
    expect(shouldResetEditorOnAuthChange("user-a", "user-a")).toBe(false);
  });
});

describe("resetEditorSession", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProjectId: "project-1",
      currentProjectName: "Secret",
      projects: [],
      isDirty: true,
    });
    useDocumentStore.getState().addLayer("Private");
  });

  it("clears the open cloud project and replaces the document", () => {
    const before = useDocumentStore.getState().layers.length;
    expect(before).toBeGreaterThan(1);

    resetEditorSession();

    expect(useProjectStore.getState().currentProjectId).toBeNull();
    expect(useProjectStore.getState().currentProjectName).toBeNull();
    expect(useProjectStore.getState().isDirty).toBe(false);
    expect(useDocumentStore.getState().layers).toHaveLength(1);
    expect(useCanvasStore.getState().canvasSize).toEqual({
      width: 800,
      height: 600,
    });
  });
});
