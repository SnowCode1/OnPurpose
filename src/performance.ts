// Aggregate only timings/counts: never habit names, values, dates or log content.
export const performanceEnabled =
  typeof __DEV__ !== 'undefined' &&
  __DEV__ &&
  process.env.EXPO_PUBLIC_DEV_PERFORMANCE === 'true';
const samples = new Map<
  string,
  { count: number; total: number; max: number }
>();
let timer: ReturnType<typeof setTimeout> | undefined;
export function recordPerformance(name: string, duration = 0) {
  if (!performanceEnabled) return;
  const sample = samples.get(name) ?? { count: 0, total: 0, max: 0 };
  sample.count++;
  sample.total += duration;
  sample.max = Math.max(sample.max, duration);
  samples.set(name, sample);
  if (timer) return;
  timer = setTimeout(() => {
    console.info(
      '[OnPurpose performance]',
      Object.fromEntries(
        [...samples].map(([key, value]) => [
          key,
          {
            count: value.count,
            averageMs: +(value.total / value.count).toFixed(2),
            maxMs: +value.max.toFixed(2),
          },
        ]),
      ),
    );
    samples.clear();
    timer = undefined;
  }, 5000);
}
