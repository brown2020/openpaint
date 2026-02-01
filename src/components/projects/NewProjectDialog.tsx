"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Size } from "@/types";

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, size: Size) => Promise<void>;
}

const PRESET_SIZES: { name: string; size: Size }[] = [
  { name: "Small (800x600)", size: { width: 800, height: 600 } },
  { name: "Medium (1280x720)", size: { width: 1280, height: 720 } },
  { name: "Large (1920x1080)", size: { width: 1920, height: 1080 } },
  { name: "Square (1024x1024)", size: { width: 1024, height: 1024 } },
  { name: "Custom", size: { width: 0, height: 0 } },
];

/**
 * Dialog for creating a new project
 */
export function NewProjectDialog({
  isOpen,
  onClose,
  onCreate,
}: NewProjectDialogProps) {
  const [name, setName] = useState("Untitled Project");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCustom = selectedPreset === PRESET_SIZES.length - 1;

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    const size = isCustom
      ? { width: customWidth, height: customHeight }
      : PRESET_SIZES[selectedPreset].size;

    if (size.width < 1 || size.height < 1) {
      setError("Canvas size must be at least 1x1.");
      return;
    }

    if (size.width > 4096 || size.height > 4096) {
      setError("Canvas size cannot exceed 4096x4096.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreate(name.trim(), size);
      onClose();
    } catch {
      setError("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Project" size="sm">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Project Name */}
        <div>
          <label
            htmlFor="project-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter project name"
          />
        </div>

        {/* Canvas Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Canvas Size
          </label>
          <div className="space-y-2">
            {PRESET_SIZES.map((preset, index) => (
              <label
                key={preset.name}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPreset === index
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="size-preset"
                  checked={selectedPreset === index}
                  onChange={() => setSelectedPreset(index)}
                  className="sr-only"
                />
                <span className="text-sm">{preset.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Size Inputs */}
        {isCustom && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label
                htmlFor="custom-width"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Width
              </label>
              <input
                id="custom-width"
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                min={1}
                max={4096}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="custom-height"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Height
              </label>
              <input
                id="custom-height"
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                min={1}
                max={4096}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}
