import { useEffect, useCallback } from "react";

/**
 * useKeyboardShortcut - Custom hook for handling keyboard shortcuts
 *
 * @param {string} key - The key to listen for (e.g., "k", "Escape", "Enter")
 * @param {function} callback - Function to call when the shortcut is triggered
 * @param {object} options - Configuration options
 * @param {boolean} options.meta - Require Cmd/Ctrl key (default: false)
 * @param {boolean} options.shift - Require Shift key (default: false)
 * @param {boolean} options.alt - Require Alt/Option key (default: false)
 * @param {boolean} options.enabled - Whether the shortcut is active (default: true)
 * @param {boolean} options.preventDefault - Prevent default browser behavior (default: true)
 *
 * @example
 * // Cmd+K to open search
 * useKeyboardShortcut("k", () => setSearchOpen(true), { meta: true });
 *
 * // Escape to close modal
 * useKeyboardShortcut("Escape", () => setModalOpen(false));
 *
 * // Shift+? to show help
 * useKeyboardShortcut("?", () => setHelpOpen(true), { shift: true });
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const {
    meta = false,
    shift = false,
    alt = false,
    enabled = true,
    preventDefault = true,
  } = options;

  const handleKeyDown = useCallback(
    (event) => {
      // Check if the shortcut is enabled
      if (!enabled) return;

      // Check if we're in an input field (unless meta key is pressed)
      const isInputField =
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable;

      // Allow shortcuts with meta key even in input fields
      if (isInputField && !meta) return;

      // Check modifier keys
      const metaPressed = event.metaKey || event.ctrlKey;
      const shiftPressed = event.shiftKey;
      const altPressed = event.altKey;

      // Match the key and required modifiers
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      const metaMatches = meta ? metaPressed : !metaPressed;
      const shiftMatches = shift ? shiftPressed : true; // Shift is optional unless required
      const altMatches = alt ? altPressed : !altPressed;

      if (keyMatches && metaMatches && shiftMatches && altMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        callback(event);
      }
    },
    [key, callback, meta, shift, alt, enabled, preventDefault]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

/**
 * useEscapeKey - Convenience hook for handling Escape key
 *
 * @param {function} callback - Function to call when Escape is pressed
 * @param {boolean} enabled - Whether the shortcut is active (default: true)
 */
export function useEscapeKey(callback, enabled = true) {
  useKeyboardShortcut("Escape", callback, { enabled });
}

/**
 * useSearchShortcut - Convenience hook for Cmd/Ctrl+K search shortcut
 *
 * @param {function} callback - Function to call when Cmd/Ctrl+K is pressed
 * @param {boolean} enabled - Whether the shortcut is active (default: true)
 */
export function useSearchShortcut(callback, enabled = true) {
  useKeyboardShortcut("k", callback, { meta: true, enabled });
}

export default useKeyboardShortcut;
