import emojiRegex from 'emoji-regex';
import { habitIconCatalog } from './habitIconCatalog.ts';
export type HabitIcon =
  `phosphor:${(typeof habitIconCatalog)[number]['id']}` | `emoji:${string}`;
const names = new Set<string>(habitIconCatalog.map((icon) => icon.id));
export function isSingleEmoji(value: string): boolean {
  if (!value || value.length > 64) return false;
  const match = emojiRegex().exec(value);
  return match?.index === 0 && match[0] === value;
}
export function isHabitIcon(value: unknown): value is HabitIcon {
  if (typeof value !== 'string') return false;
  if (value.startsWith('phosphor:')) return names.has(value.slice(9));
  return value.startsWith('emoji:') && isSingleEmoji(value.slice(6));
}
export function habitIconLabel(icon?: HabitIcon): string {
  if (!icon) return 'None';
  if (icon.startsWith('emoji:')) return icon.slice(6);
  return (
    habitIconCatalog.find((item) => `phosphor:${item.id}` === icon)?.label ??
    'Icon'
  );
}
