import { useEffect, useMemo } from 'react';
import type { ChangeStore } from './storage/store';
import { createQuickUndo } from './quickUndo';
export function useQuickUndo(store: ChangeStore) {
  const controller = useMemo(() => createQuickUndo(store), [store]);
  useEffect(() => () => controller.dispose(), [controller]);
  return controller;
}
