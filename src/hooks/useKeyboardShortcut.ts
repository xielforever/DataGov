import { useEffect, useCallback } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcut(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = [
      e.ctrlKey || e.metaKey ? 'ctrl' : '',
      e.shiftKey ? 'shift' : '',
      e.altKey ? 'alt' : '',
      e.key.toLowerCase(),
    ].filter(Boolean).join('+');

    if (shortcuts[key]) {
      e.preventDefault();
      shortcuts[key]();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
