import { checkmarkColor, colorOnBlack, dimmedColor } from './colors.ts';

// Days 0–4 share full brightness; day 8 onward and future days share the floor.
// Five palettes per colour replace repeated OKLCH work for every rendered cell.
export function dayTone(daysAgo: number): number {
  return daysAgo < 0 ? 4 : Math.max(0, Math.min(4, daysAgo - 4));
}
export function createGridPalette(colour: string) {
  const checkbox = colorOnBlack(colour, 170 / 255);
  const number = colorOnBlack(colour, 0.65);
  return {
    checkmark: checkmarkColor(colour),
    tones: Array.from({ length: 5 }, (_, index) => {
      const progress = index / 4;
      const amount = progress * progress * (3 - 2 * progress);
      return {
        checkbox: dimmedColor(checkbox, amount),
        number: dimmedColor(number, amount),
        rule: `${dimmedColor(colour, amount)}20`,
      };
    }),
  };
}
export type GridPalette = ReturnType<typeof createGridPalette>;
export const dateTones = Array.from({ length: 5 }, (_, index) => {
  const progress = index / 4;
  const amount = progress * progress * (3 - 2 * progress);
  return {
    label: dimmedColor('#979797', amount, 0.56),
    number: dimmedColor('#E8E8E8', amount, 0.56),
  };
});
