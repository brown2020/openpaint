"use client";

import { useHomeEditor } from "@/hooks/useHomeEditor";
import { CanvasContainer } from "@/components/canvas/CanvasContainer";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { ToolPanel } from "@/components/toolbar/ToolPanel";
import { ColorPicker } from "@/components/toolbar/ColorPicker";
import { BrushSettings } from "@/components/toolbar/BrushSettings";
import { PropertiesPanel } from "@/components/panels/PropertiesPanel";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { StatusBar } from "@/components/panels/StatusBar";
import { AuthModal, GuestSignInBanner } from "@/components/auth";
import { ProjectListModal, NewProjectDialog } from "@/components/projects";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function Home() {
  const {
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
  } = useHomeEditor();

  if (!authInitialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading OpenPaint...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Open local project file"
      />

      {showGuestBanner && (
        <GuestSignInBanner
          onSignIn={() => openAuthModal()}
          onOpenCloudProjects={handleOpenCloudProjects}
          dismissed={false}
          onDismiss={handleDismissBanner}
        />
      )}

      <header>
      <Toolbar
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={docCanUndo()}
        canRedo={docCanRedo()}
        onSave={handleSave}
        onExportPng={handleExportPng}
        onExportSvg={handleExportSvg}
        onNew={handleNew}
        onOpen={handleOpen}
        onSignIn={
          !user && isFirebaseConfigured ? () => openAuthModal() : undefined
        }
        saveTitle={
          user
            ? "Save to cloud (Ctrl+S)"
            : isFirebaseConfigured
              ? "Save locally (Ctrl+S)"
              : "Save (Ctrl+S)"
        }
      />
      </header>

      <main className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-16 flex flex-col gap-2 p-2 bg-gray-100 border-r border-gray-300">
          <ToolPanel />
        </div>

        <div className="w-48 flex flex-col gap-2 p-2 bg-gray-50 border-r border-gray-300 overflow-y-auto">
          <ColorPicker />
          <BrushSettings />
        </div>

        <CanvasContainer />

        <div className="w-56 flex flex-col bg-gray-50 border-l border-gray-300 overflow-y-auto">
          <div className="border-b border-gray-300">
            <PropertiesPanel />
          </div>
          <div className="p-2 flex-1">
            <LayersPanel />
          </div>
        </div>
      </main>

      <footer>
      <StatusBar />
      </footer>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        closable
      />

      <ProjectListModal
        isOpen={showProjectList}
        onClose={() => setProjectListOpen(false)}
        closable={!!currentProjectId}
      />

      <NewProjectDialog
        isOpen={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
