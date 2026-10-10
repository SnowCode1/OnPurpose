import { colorOnBlack } from './colors';
import type { Outcome } from './statsSeries';

// One colour language for every chart and the calendar: full habit colour for
// success, the same hue faded for a scheduled miss, neutral grey off-schedule.
export const MISSED_OPACITY = 0.32;
export const OFF_FILL = '#3C3C3C';

export function outcomeFill(colour: string, outcome: Outcome) {
  switch (outcome) {
    case 'met':
    case 'track':
      return colour;
    case 'missed':
    case 'open':
      return colorOnBlack(colour, MISSED_OPACITY);
    case 'off':
      return OFF_FILL;
    default:
      return null;
  }
}

/** Stepped brightness for combined periods: brighter means more days met. */
export function levelFill(colour: string, ratio: number) {
  return colorOnBlack(
    colour,
    ratio >= 1 ? 1 : ratio >= 0.5 ? 0.72 : ratio > 0 ? 0.5 : MISSED_OPACITY,
  );
}
