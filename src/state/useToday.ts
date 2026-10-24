import { useEffect, useState } from 'react';
import { msUntilMidnight, toDateKey, type DateKey } from '../lib/date';

/** The player's local date, updating at local midnight and when the app returns to the foreground. */
export function useToday(): DateKey {
  const [today, setToday] = useState(() => toDateKey());

  useEffect(() => {
    const refresh = () => setToday(toDateKey());
    const timer = window.setTimeout(refresh, msUntilMidnight() + 1000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [today]);

  return today;
}
