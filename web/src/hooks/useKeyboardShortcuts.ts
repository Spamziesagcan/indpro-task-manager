"use client";

import * as React from "react";

type ShortcutMap = Partial<Record<string, (event: KeyboardEvent) => void>>;

type UseKeyboardShortcutsOptions = {
  enabled?: boolean;
  ignoreWhenTyping?: boolean;
  ignoreRepeat?: boolean;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap, options: UseKeyboardShortcutsOptions = {}) {
  const { enabled = true, ignoreWhenTyping = true, ignoreRepeat = true } = options;
  const shortcutsRef = React.useRef(shortcuts);

  React.useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (ignoreWhenTyping && isEditableTarget(event.target)) return;
      if (ignoreRepeat && event.repeat) return;
      if (event.defaultPrevented) return;

      const handler = shortcutsRef.current[event.key.toLowerCase()];
      if (!handler) return;

      handler(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, ignoreWhenTyping, ignoreRepeat]);
}
