import { useEffect } from 'react';

// useKeyboardShortcuts hook
// Registers keyboard shortcuts and cleans up listeners on unmount to prevent memory leaks
// IMPORTANT: more specific shortcuts (like those with shiftKey) must come first!
export const useKeyboardShortcuts = (shortcuts) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Iterate over all shortcuts
      for (const shortcut of shortcuts) {
        const { 
          ctrlKey, 
          shiftKey, 
          key, 
          onKeyDown 
        } = shortcut;
        
        // Check each modifier requirement explicitly
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
          return; // Stop checking other shortcuts once we've found a match
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup: remove event listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};
