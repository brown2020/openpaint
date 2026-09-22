"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import type { ProjectDocument } from "@/lib/firebase/firestore";

interface ProjectCardProps {
  project: ProjectDocument;
  onSelect: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onRename: (projectId: string, newName: string) => void;
}

/**
 * Individual project card with thumbnail
 */
export function ProjectCard({
  project,
  onSelect,
  onDelete,
  onRename,
}: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(project.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleRename = () => {
    if (newName.trim() && newName !== project.name) {
      onRename(project.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRename();
    } else if (e.key === "Escape") {
      setNewName(project.name);
      setIsRenaming(false);
    }
  };

  const modifiedLabel = useMemo(() => {
    const timestamp = project.modifiedAt as { toDate?: () => Date } | null;
    if (!timestamp || !timestamp.toDate) return "Unknown";
    const date = timestamp.toDate();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
  }, [project.modifiedAt]);

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {isRenaming ? (
        <div className="p-3">
          <div className="relative aspect-video bg-gray-100 mb-3 flex items-center justify-center">
            {project.thumbnailUrl ? (
              <Image
                src={project.thumbnailUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-contain"
              />
            ) : (
              <div className="text-gray-400" aria-hidden>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <input
            type="text"
            aria-label="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none"
            autoFocus
          />
        </div>
      ) : (
        <button
          type="button"
          className="w-full text-left"
          onClick={() => onSelect(project.id)}
          aria-label={`Open project ${project.name}`}
        >
          <div className="relative aspect-video bg-gray-100 flex items-center justify-center">
            {project.thumbnailUrl ? (
              <Image
                src={project.thumbnailUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-contain"
              />
            ) : (
              <div className="text-gray-400" aria-hidden>
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{modifiedLabel}</p>
            <p className="text-xs text-gray-400">
              {project.canvasSize.width} x {project.canvasSize.height}
            </p>
          </div>
        </button>
      )}

      <div ref={menuRef} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          aria-label="Project menu"
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 bg-white rounded-full shadow hover:bg-gray-100"
        >
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <button
              type="button"
              onClick={() => {
                setIsRenaming(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete(project.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
