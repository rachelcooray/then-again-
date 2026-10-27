import { config } from '../config';
import { getDailySet } from '../content/daily';
import type { DateKey } from '../lib/date';
import { useRemoteConfig, type RemoteConfig } from '../lib/remoteConfig';
import { useStore, type PlusState } from './store';

/** Who can play what: the free games for everyone, today's four for everyone, the rest with Plus. */
export interface Access {
  /** The paywall is switched on. */
  on: boolean;
  plus: boolean;
  free: string[];
  locked: (formatId: string, date: DateKey) => boolean;
}

export function accessFor(remote: Pick<RemoteConfig, 'monetisation_enabled' | 'free_formats'>, plus: PlusState | undefined): Access {
  const on = config.monetisationEnabled && remote.monetisation_enabled;
  const free = remote.free_formats.length ? remote.free_formats : config.freeFormats;
  return {
    on,
    plus: !!plus,
    free,
    locked: (formatId, date) =>
      on && !plus && !free.includes(formatId) && !(config.dailyFourAlwaysFree && getDailySet(date).formats.includes(formatId)),
  };
}

export function useAccess(): Access {
  const { data } = useStore();
  return accessFor(useRemoteConfig(), data.plus);
}
