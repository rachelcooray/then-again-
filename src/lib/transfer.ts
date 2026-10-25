import type { AppData } from '../state/store';

/**
 * "Move to a new phone": the player's progress as a code they can copy on the old phone and
 * paste on the new one. No account and no server involved.
 */

export type Transferable = Pick<AppData, 'progress' | 'settings' | 'reminders'> & Partial<Pick<AppData, 'memories'>>;

const toBase64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

const canCompress = () => typeof CompressionStream !== 'undefined';

export async function makeTransferCode(data: AppData): Promise<string> {
  const json = JSON.stringify({ v: 1, progress: data.progress, settings: data.settings, reminders: data.reminders, memories: data.memories });
  const bytes = new TextEncoder().encode(json);
  if (canCompress()) return `TA1.${toBase64Url(await pipe(bytes, new CompressionStream('deflate-raw')))}`;
  return `TA0.${toBase64Url(bytes)}`;
}

export async function readTransferCode(code: string): Promise<Transferable> {
  const clean = code.replace(/\s+/g, '');
  const [prefix, body] = [clean.slice(0, 4), clean.slice(4)];
  if ((prefix !== 'TA1.' && prefix !== 'TA0.') || !body) throw new Error('That doesn’t look like a Then Again code. Check you copied all of it.');
  try {
    let bytes = fromBase64Url(body);
    if (prefix === 'TA1.') bytes = await pipe(bytes, new DecompressionStream('deflate-raw'));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Transferable & { v: number };
    if (parsed.v !== 1 || typeof parsed.progress !== 'object') throw new Error('bad');
    return { progress: parsed.progress, settings: parsed.settings, reminders: parsed.reminders, memories: Array.isArray(parsed.memories) ? parsed.memories : [] };
  } catch {
    throw new Error('That code didn’t work. It may have been cut short when it was copied.');
  }
}
