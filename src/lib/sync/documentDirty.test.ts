import { beforeEach, describe, expect, it } from "vitest";
import { useProjectStore } from "@/store/projectStore";
import { markDocumentDirty } from "./documentDirty";

describe("markDocumentDirty", () => {
  beforeEach(() => {
    useProjectStore.setState({
      currentProjectId: null,
      isDirty: false,
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
  });
});
