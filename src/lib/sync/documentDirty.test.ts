import { beforeEach, describe, expect, it } from "vitest";
import { useProjectStore } from "@/store/projectStore";
import { markDocumentDirty } from "./documentDirty";

describe("markDocumentDirty", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProjectId: null,
      isDirty: false,
      dirtyRevision: 0,
    });
  });

  it("does not mark dirty without an open cloud project", () => {
    markDocumentDirty();
    expect(useProjectStore.getState().isDirty).toBe(false);
  });

  it("marks dirty when a cloud project is open", () => {
    useProjectStore.setState({
      currentProjectId: "project-1",
      currentProjectName: "Test",
      isDirty: false,
    });

    markDocumentDirty();
    expect(useProjectStore.getState().isDirty).toBe(true);
    expect(useProjectStore.getState().dirtyRevision).toBe(1);
  });

  it("does not clear edits made after a save snapshot was captured", () => {
    useProjectStore.setState({
      currentProjectId: "project-1",
      currentProjectName: "Test",
      isDirty: false,
      dirtyRevision: 0,
    });

    markDocumentDirty();
    const saveRevision = useProjectStore.getState().dirtyRevision;

    markDocumentDirty();
    useProjectStore.getState().clearDirty(saveRevision);

    expect(useProjectStore.getState().isDirty).toBe(true);
    expect(useProjectStore.getState().dirtyRevision).toBe(2);

    useProjectStore.getState().clearDirty(2);
    expect(useProjectStore.getState().isDirty).toBe(false);
  });
});
