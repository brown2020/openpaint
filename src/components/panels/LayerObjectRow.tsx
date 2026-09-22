"use client";

import type { VectorObject } from "@/types/vector";
import { formatObjectListLabel } from "@/lib/vector/objectLabel";

type ObjectRowProps = {
  layerId: string;
  obj: VectorObject;
  layerLocked: boolean;
  isSelected: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
  onSelectObject: (layerId: string, objectId: string) => void;
  onToggleVisible: (objectId: string, visible: boolean) => void;
  onToggleLocked: (objectId: string, locked: boolean) => void;
  onDeleteObject: (objectId: string) => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
};

function rowClass(isSelected: boolean, isDragSource: boolean, visible: boolean) {
  const base =
    "flex items-center gap-1.5 pl-2 pr-2 py-1.5 border-b border-gray-100 last:border-b-0";
  const selected = isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : "hover:bg-gray-100";
  const drag = isDragSource ? "opacity-50" : "";
  const hidden = visible ? "" : "opacity-60";
  return `${base} ${selected} ${drag} ${hidden}`;
}

export function ObjectRow(props: ObjectRowProps) {
  const { obj, layerLocked, isSelected, isDragSource, isDropTarget, onDragEnter, onDragOver, onDrop } =
    props;
  const dragEnabled = !layerLocked;

  return (
    <li
      onDragEnter={dragEnabled ? onDragEnter : undefined}
      onDragOver={dragEnabled ? onDragOver : undefined}
      onDrop={dragEnabled ? (e) => { e.preventDefault(); onDrop(); } : undefined}
      className={isDropTarget ? "border-t-2 border-blue-400" : undefined}
    >
      <div
        aria-current={isSelected ? "true" : undefined}
        className={rowClass(isSelected, isDragSource, obj.visible)}
      >
        <DragHandle dragEnabled={dragEnabled} objId={obj.id} onDragStart={props.onDragStart} onDragEnd={props.onDragEnd} />
        <VisibilityButton disabled={layerLocked} visible={obj.visible} objectId={obj.id} onToggle={props.onToggleVisible} />
        <LockButton disabled={layerLocked} locked={obj.locked} objectId={obj.id} onToggle={props.onToggleLocked} />
        <SelectLabel layerId={props.layerId} obj={obj} onSelectObject={props.onSelectObject} />
        <DeleteButton disabled={layerLocked || obj.locked} objectId={obj.id} onDelete={props.onDeleteObject} />
      </div>
    </li>
  );
}

function DragHandle({
  dragEnabled,
  objId,
  onDragStart,
  onDragEnd,
}: {
  dragEnabled: boolean;
  objId: string;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <span
      draggable={dragEnabled}
      onDragStart={
        dragEnabled
          ? (e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", objId);
              onDragStart();
            }
          : undefined
      }
      onDragEnd={dragEnabled ? onDragEnd : undefined}
      className={`shrink-0 p-0.5 rounded text-gray-400 ${
        dragEnabled ? "cursor-grab active:cursor-grabbing hover:text-gray-600" : "cursor-not-allowed"
      }`}
      title={dragEnabled ? "Drag to reorder" : "Layer is locked"}
      aria-label={dragEnabled ? "Drag to reorder" : "Reorder disabled — layer locked"}
    >
      <DragHandleIcon />
    </span>
  );
}

function VisibilityButton({
  disabled,
  visible,
  objectId,
  onToggle,
}: {
  disabled: boolean;
  visible: boolean;
  objectId: string;
  onToggle: (objectId: string, visible: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(objectId, !visible)}
      className={`p-0.5 rounded shrink-0 ${
        disabled ? "text-gray-300 cursor-not-allowed" : visible ? "text-gray-600" : "text-gray-400"
      }`}
      title={visible ? "Hide object" : "Show object"}
      aria-label={visible ? "Hide object" : "Show object"}
    >
      <EyeIcon visible={visible} small />
    </button>
  );
}

function LockButton({
  disabled,
  locked,
  objectId,
  onToggle,
}: {
  disabled: boolean;
  locked: boolean;
  objectId: string;
  onToggle: (objectId: string, locked: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(objectId, !locked)}
      className={`p-0.5 rounded shrink-0 ${
        disabled ? "text-gray-300 cursor-not-allowed" : locked ? "text-yellow-600" : "text-gray-400"
      }`}
      title={locked ? "Unlock object" : "Lock object"}
      aria-label={locked ? "Unlock object" : "Lock object"}
    >
      <LockIcon locked={locked} small />
    </button>
  );
}

function SelectLabel({
  layerId,
  obj,
  onSelectObject,
}: {
  layerId: string;
  obj: VectorObject;
  onSelectObject: (layerId: string, objectId: string) => void;
}) {
  const label = formatObjectListLabel(obj);
  return (
    <button
      type="button"
      onClick={() => onSelectObject(layerId, obj.id)}
      className="flex-1 min-w-0 text-left text-xs truncate text-gray-700"
      title={label}
    >
      {label}
    </button>
  );
}

function DeleteButton({
  disabled,
  objectId,
  onDelete,
}: {
  disabled: boolean;
  objectId: string;
  onDelete: (objectId: string) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onDelete(objectId)}
      className={`p-0.5 rounded shrink-0 ${
        disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-red-600"
      }`}
      title="Delete object"
      aria-label="Delete object"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function DragHandleIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}

export function EyeIcon({ visible, small }: { visible: boolean; small?: boolean }) {
  const cls = small ? "w-3.5 h-3.5" : "w-4 h-4";
  if (visible) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export function LockIcon({ locked, small }: { locked: boolean; small?: boolean }) {
  const cls = small ? "w-3.5 h-3.5" : "w-4 h-4";
  if (locked) {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  );
}
