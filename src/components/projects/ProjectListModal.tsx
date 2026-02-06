"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ProjectCard } from "./ProjectCard";
import { NewProjectDialog } from "./NewProjectDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { useProjects } from "@/hooks/useProjects";
import type { ProjectDocument } from "@/lib/firebase/firestore";
import type { Size } from "@/types";

interface ProjectListModalProps {
  isOpen: boolean;
  onClose?: () => void;
  closable?: boolean;
}

/**
 * Modal showing list of user's projects
 */
export function ProjectListModal({
  isOpen,
  onClose,
  closable = false,
}: ProjectListModalProps) {
  const {
    projects,
    fetchProjects,
    loadProject,
    createNewProject,
    deleteProject,
    renameProject,
  } = useProjects();

  const [loading, setLoading] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [deleteDialogProject, setDeleteDialogProject] =
    useState<ProjectDocument | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    fetchProjects().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      setLoading(true);
    };
  }, [isOpen, fetchProjects]);

  const handleSelectProject = async (projectId: string) => {
    setLoading(true);
    const result = await loadProject(projectId);
    if (result) {
      onClose?.();
    }
    setLoading(false);
  };

  const handleCreateProject = async (name: string, size: Size) => {
    const projectId = await createNewProject(name, size);
    if (projectId) {
      onClose?.();
    }
  };

  const handleDeleteProject = async () => {
    if (deleteDialogProject) {
      await deleteProject(deleteDialogProject.id);
      setDeleteDialogProject(null);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    await renameProject(projectId, newName);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={closable ? onClose : undefined}
        title="Your Projects"
        size="lg"
      >
        <div className="space-y-4">
          {/* Header with New Project button */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {projects.length === 0
                ? "No projects yet. Create your first one!"
                : `${projects.length} project${projects.length !== 1 ? "s" : ""}`}
            </p>
            <button
              onClick={() => setShowNewDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Project
            </button>
          </div>

          {/* Project Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first project to start painting!
              </p>
              <button
                onClick={() => setShowNewDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={handleSelectProject}
                  onDelete={(id) => {
                    const proj = projects.find((p) => p.id === id);
                    if (proj) setDeleteDialogProject(proj);
                  }}
                  onRename={handleRenameProject}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* New Project Dialog */}
      <NewProjectDialog
        isOpen={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onCreate={handleCreateProject}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialogProject && (
        <DeleteConfirmDialog
          isOpen={true}
          projectName={deleteDialogProject.name}
          onClose={() => setDeleteDialogProject(null)}
          onConfirm={handleDeleteProject}
        />
      )}
    </>
  );
}
