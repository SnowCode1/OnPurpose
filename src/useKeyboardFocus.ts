import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// On Android, autoFocus inside a Modal focuses the field before the dialog can
// show a keyboard, and a later focus() on that already-focused field is
// ignored. Android therefore skips autoFocus and focuses once the dialog is
// up. Spread the result onto the TextInput; iOS keeps plain autoFocus.
export function useKeyboardFocus<T extends { focus: () => void }>(
  enabled = true,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!enabled || Platform.OS !== 'android') return;
    const timer = setTimeout(() => ref.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [enabled]);
  return { ref, autoFocus: enabled && Platform.OS !== 'android' };
}
