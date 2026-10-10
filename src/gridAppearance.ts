import { checkmarkColor } from './colors.ts';
import { blackTheme, type Theme } from './theme.ts';

// Days 0–4 share full brightness; day 8 onward and future days share the floor.
// Five palettes per colour replace repeated OKLCH work for every rendered cell.
export function dayTone(daysAgo: number): number {
  return daysAgo < 0 ? 4 : Math.max(0, Math.min(4, daysAgo - 4));
}
const toneAmounts = Array.from({ length: 5 }, (_, index) => {
  const progress = index / 4;
  return progress * progress * (3 - 2 * progress);
});
// `colour` is the habit's readable display colour on this background; the
// saved habit colour itself is never changed.
export function createGridPalette(
  saved: string,
  fadeDates = true,
  theme: Theme = blackTheme,
) {
  const colour = theme.colour(saved);
  const checkbox = theme.mix(colour, 170 / 255);
  const number = theme.mix(colour, 0.65);
  return {
    colour,
    // Cell backgrounds travel with the palette so cells need no theme context.
    background: theme.background,
    todayBackground: theme.ink(0x09),
    pressed: `${colour}20`,
    checkmark: checkmarkColor(colour),
    completedBackground: theme.mix(colour, 0.1),
    tones: toneAmounts.map((tone) => {
      const amount = fadeDates ? tone : 0;
      return {
        checkbox: theme.fade(checkbox, amount),
        number: theme.fade(number, amount),
        rule: `${theme.fade(colour, amount)}20`,
      };
    }),
  };
}
export type GridPalette = ReturnType<typeof createGridPalette>;
export type DateTone = { label: string; number: string };
const dateToneCache = new WeakMap<Theme, DateTone[]>();
export function dateTones(theme: Theme = blackTheme): DateTone[] {
  let tones = dateToneCache.get(theme);
  if (!tones) {
    tones = toneAmounts.map((amount) => ({
      label: theme.fade(theme.ink(0x97), amount, 0.56),
      number: theme.fade(theme.ink(0xe8), amount, 0.56),
    }));
    dateToneCache.set(theme, tones);
  }
  return tones;
}
