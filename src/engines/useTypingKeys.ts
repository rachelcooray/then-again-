import { useEffect, useRef } from 'react';

/**
 * Physical keyboard support for typing games on desktop. The handler returns true when it
 * used the key. Keys aimed at a focused button, field or link are left alone, so Tab, Enter
 * and Space keep working on the controls themselves.
 */
export function useTypingKeys(active: boolean, handler: (key: string) => boolean) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((tag === 'BUTTON' || tag === 'A') && (e.key === 'Enter' || e.key === ' ')) return;
      if (ref.current(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

/** On-screen keys shouldn't take focus from a mouse or finger, so typing carries on. */
export const keepFocus = { onPointerDown: (e: { preventDefault(): void }) => e.preventDefault() };
