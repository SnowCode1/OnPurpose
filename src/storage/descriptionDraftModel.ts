import { MAX_DESCRIPTION_LENGTH } from '../description.ts';
import type { SqlPort } from './repository.ts';
export type DescriptionDraft = { version: 1; base: string; text: string };
export interface DraftPort {
  get(key: string): Promise<DescriptionDraft | null>;
  put(key: string, draft: DescriptionDraft): Promise<void>;
  remove(key: string): Promise<void>;
}
export function validateDraft(
  value: unknown,
): asserts value is DescriptionDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid description draft.');
  const draft = value as Record<string, unknown>;
  if (
    Object.keys(draft).length !== 3 ||
    draft.version !== 1 ||
    !['base', 'text'].every(
      (key) =>
        typeof draft[key] === 'string' &&
        (draft[key] as string).length <= MAX_DESCRIPTION_LENGTH,
    )
  )
    throw new Error('Invalid description draft.');
}
export function serializedDrafts(port: DraftPort): DraftPort {
  let tail: Promise<unknown> = Promise.resolve();
  function queue<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  }
  return {
    get: (key) => queue(() => port.get(key)),
    put: (key, draft) => {
      validateDraft(draft);
      return queue(() => port.put(key, draft));
    },
    remove: (key) => queue(() => port.remove(key)),
  };
}
export function sqliteDrafts(db: SqlPort): DraftPort {
  return {
    async get(key) {
      const row = await db.getFirstAsync<{ draft_json: string }>(
        'SELECT draft_json FROM description_drafts WHERE draft_key = ?',
        key,
      );
      if (!row) return null;
      const parsed: unknown = JSON.parse(row.draft_json);
      validateDraft(parsed);
      return parsed;
    },
    async put(key, draft) {
      validateDraft(draft);
      await db.runAsync(
        'INSERT INTO description_drafts (draft_key, draft_json) VALUES (?, ?) ON CONFLICT(draft_key) DO UPDATE SET draft_json = excluded.draft_json',
        key,
        JSON.stringify(draft),
      );
    },
    async remove(key) {
      await db.runAsync(
        'DELETE FROM description_drafts WHERE draft_key = ?',
        key,
      );
    },
  };
}
export function memoryDrafts(): DraftPort {
  const drafts = new Map<string, DescriptionDraft>();
  return serializedDrafts({
    get: async (key) => drafts.get(key) ?? null,
    put: async (key, draft) => {
      drafts.set(key, { ...draft });
    },
    remove: async (key) => {
      drafts.delete(key);
    },
  });
}
