import { openDatabaseAsync } from 'expo-sqlite';
import {
  randomUUID,
  digestStringAsync,
  CryptoDigestAlgorithm,
} from 'expo-crypto';
import { demoHabits } from '../habits';
import { ChangeStore } from './store';
import { sqliteRepository } from './repository';
import type { EventMeta } from './model';

function metadata(sequence: number): EventMeta {
  const now = new Date();
  return {
    version: 3,
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
export function openStore(): Promise<ChangeStore> {
  if (!opening) {
    opening = (async () => {
      const db = await openDatabaseAsync('onpurpose.db');
      const store = new ChangeStore(
        sqliteRepository(db, () => ({
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
  }
  return opening;
}
