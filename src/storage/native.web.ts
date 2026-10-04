import {
  randomUUID,
  digestStringAsync,
  CryptoDigestAlgorithm,
} from 'expo-crypto';
import { demoHabits } from '../habits';
import { browserRepository } from './browserRepository';
import { ChangeStore } from './store';
import type { EventMeta } from './model';
function metadata(sequence: number): EventMeta {
  const now = new Date();
  return {
    version: 1,
    id: randomUUID(),
    sequence,
    recordedAt: now.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    utcOffsetMinutes: -now.getTimezoneOffset(),
  };
}
export const digest = (text: string) =>
  digestStringAsync(CryptoDigestAlgorithm.SHA256, text);
let opening: Promise<ChangeStore> | null = null;
export function openStore() {
  if (!opening)
    opening = (async () => {
      const store = new ChangeStore(
        browserRepository(localStorage, () => ({
          ...metadata(1),
          type: 'initialize',
          habits: demoHabits,
        })),
        metadata,
      );
      await store.load();
      return store;
    })().catch((error) => {
      opening = null;
      throw error;
    });
  return opening;
}
