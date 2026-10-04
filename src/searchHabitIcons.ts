import { commonHabitIcons } from './commonHabitIcons.ts';
import { habitIconCatalog } from './habitIconCatalog.ts';

export type IconChoice = (typeof habitIconCatalog)[number];
const byId = new Map<string, IconChoice>(
  habitIconCatalog.map((icon) => [icon.id, icon]),
);
const common = commonHabitIcons.map((icon) => byId.get(icon.id)!);
function normalize(value: string) {
  return value.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
}
const searchable = habitIconCatalog.map((icon) => ({
  icon,
  text: normalize(`${icon.id} ${icon.label} ${icon.tags}`),
}));
// Search always spans the whole catalogue, even when browsing Common.
export function searchHabitIcons(
  query: string,
  showAll = false,
): readonly IconChoice[] {
  const normalized = normalize(query);
  if (!normalized) return showAll ? habitIconCatalog : common;
  const words = normalized.split(' ');
  return searchable
    .filter(({ text }) => words.every((word) => text.includes(word)))
    .map(({ icon }) => icon);
}
