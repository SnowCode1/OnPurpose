export const STATS_DISMISS_DISTANCE = 76;
export function shouldDismissStats(
  startedAtTop: boolean,
  offsetY: number,
  velocityY: number,
) {
  'worklet';
  // Reversing back into the page cancels, even if the user crossed the threshold.
  return startedAtTop && offsetY <= -STATS_DISMISS_DISTANCE && velocityY <= 0;
}
