import { useEffect, useRef } from 'react';

// useKeyboardShortcuts hook
// Uses a ref to hold the latest shortcuts so the event listener is only ever
// registered ONCE (empty dep array), avoiding constant add/remove on every
// render while still reading up-to-date handler closures.
// IMPORTANT: more specific shortcuts (shiftKey) must come first in the array!
export const useKeyboardShortcuts = (shortcuts) => {
  // Always keep the ref pointing to the latest shortcuts array
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Read from the ref so closures are always fresh
      for (const shortcut of shortcutsRef.current) {
        const { ctrlKey, shiftKey, key, onKeyDown } = shortcut;

        let modifiersMatch = true;

        // Check Ctrl/Cmd requirement
        if (ctrlKey && !e.ctrlKey && !e.metaKey) {
          modifiersMatch = false;
        }
        // Check Shift requirement
        if (shiftKey && !e.shiftKey) {
          modifiersMatch = false;
        }
        // If shortcut doesn't require shift, make sure shift isn't pressed
        if (!shiftKey && e.shiftKey) {
          modifiersMatch = false;
        }

        // Check key matches (case-insensitive)
        const keyMatches = e.key.toLowerCase() === key.toLowerCase();

        if (modifiersMatch && keyMatches) {
          e.preventDefault();
          onKeyDown();
          return; // Stop after first matching shortcut
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup: remove listener on unmount only
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty array: register once, ref always provides latest values
};
