import { useRef, useState, type KeyboardEvent } from 'react';

/**
 * Keyboard movement for a grid of buttons: one cell is in the tab order and the arrow
 * keys, Home and End move between cells, so a 9×9 grid is one Tab stop rather than 81.
 */
export function useRovingGrid(count: number, cols: number, initial = 0) {
  const [active, setActive] = useState(initial);
  const refs = useRef<(HTMLElement | null)[]>([]);

  const move = (to: number) => {
    const next = Math.max(0, Math.min(count - 1, to));
    setActive(next);
    refs.current[next]?.focus();
    return next;
  };

  const onKeyDown = (e: KeyboardEvent): number | null => {
    const deltas: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols };
    if (e.key in deltas) {
      const to = active + deltas[e.key];
      if (to < 0 || to >= count) return null;
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && Math.floor(to / cols) !== Math.floor(active / cols)) return null;
      e.preventDefault();
      return move(to);
    }
    if (e.key === 'Home') {
      e.preventDefault();
      return move(active - (active % cols));
    }
    if (e.key === 'End') {
      e.preventDefault();
      return move(active - (active % cols) + cols - 1);
    }
    return null;
  };

  const cellProps = (i: number) => ({
    ref: (el: HTMLElement | null) => {
      refs.current[i] = el;
    },
    tabIndex: i === active ? 0 : -1,
    onFocus: () => setActive(i),
  });

  return { active, setActive, onKeyDown, cellProps, focusCell: move };
}
