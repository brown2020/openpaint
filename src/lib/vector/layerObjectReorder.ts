/**
 * Map layers-panel UI index (top object first) to `layer.objects` array index.
 */
export function uiIndexToArrayIndex(
  uiIndex: number,
  objectCount: number,
): number {
  return objectCount - 1 - uiIndex;
}

/**
 * Compute `reorderObject(fromIndex, toIndex)` indices when dropping on a UI row.
 */
export function computeObjectReorder(
  objectCount: number,
  fromArrayIndex: number,
  targetUiIndex: number,
): { fromIndex: number; toIndex: number } | null {
  if (objectCount <= 0) return null;
  if (fromArrayIndex < 0 || fromArrayIndex >= objectCount) return null;
  if (targetUiIndex < 0 || targetUiIndex >= objectCount) return null;

  const toIndex = uiIndexToArrayIndex(targetUiIndex, objectCount);
  if (fromArrayIndex === toIndex) return null;

  return { fromIndex: fromArrayIndex, toIndex };
}
