import { Circle, Path } from 'react-native-svg';
import { ChartFrame, type ChartSlot } from './ChartFrame';
import { colorOnBlack } from './colors';
import type { WeekStart } from './displayPreferences';
import { dateKey } from './statistics';
import {
  formatStatistic as format,
  statisticDayLabel,
  statisticMonthLabel,
  statisticSpanLabel,
  statisticTickLabel,
} from './statisticsFormatting';
import {
  binKey,
  niceMaximum,
  timeTicks,
  valueUnit,
  type BinUnit,
} from './statsSeries';

/**
 * The streak each day ended with: it climbs while the chain continues and
 * drops to zero when it breaks, so length, timing, the record and today's
 * streak read together. Long ranges group selection by week or month.
 */
export function StreakChart({
  colour,
  values,
  noun,
  from,
  to,
  today,
  weekStart,
}: {
  colour: string;
  /** One value per day from `from` to `to`. */
  values: number[];
  /** Plural unit, e.g. "days" or "weeks". */
  noun: string;
  from: number;
  to: number;
  today: string;
  weekStart: WeekStart;
}) {
  const span = to - from + 1,
    unit: BinUnit = valueUnit(span),
    maximum = niceMaximum(Math.max(1, ...values));
  const amount = (value: number) =>
    `${format(value)} ${value === 1 ? noun.replace(/s$/, '') : noun}`;
  const groups: { from: number; to: number; best: number; last: number }[] = [];
  values.forEach((value, index) => {
    const day = from + index,
      key = binKey(day, unit, weekStart),
      group = groups.at(-1);
    if (group && binKey(group.from, unit, weekStart) === key) {
      group.to = day;
      group.best = Math.max(group.best, value);
      group.last = value;
    } else groups.push({ from: day, to: day, best: value, last: value });
  });
  const slots: ChartSlot[] = groups.map((group) => {
    const start = dateKey(group.from);
    return {
      key: start,
      x0: (group.from - from) / span,
      x1: (group.to + 1 - from) / span,
      title:
        unit === 'day'
          ? statisticDayLabel(start, today)
          : unit === 'month'
            ? statisticMonthLabel(start)
            : statisticSpanLabel(start, dateKey(group.to), today),
      value:
        unit === 'day'
          ? group.last
            ? `${amount(group.last)} in a row`
            : 'No streak'
          : group.best
            ? `longest ${amount(group.best)} · ended at ${amount(group.last)}`
            : 'No streak',
    };
  });
  const peak = values.reduce(
    (best, value, index) => (value > values[best] ? index : best),
    0,
  );
  return (
    <ChartFrame
      name="Streak chart"
      colour={colour}
      slots={slots}
      height={96}
      ticks={timeTicks(from, to, weekStart).map((tick) => ({
        x: (tick.day - from) / span,
        label: statisticTickLabel(dateKey(tick.day), tick.kind),
      }))}
      axis={[
        { y: 0, label: format(maximum) },
        { y: 1, label: '0' },
      ]}
      legend={`Streak length in ${noun} · climbs each success, resets on a miss`}
      draw={({ width, height }) => {
        const x = (index: number) => ((index + 0.5) / span) * width,
          y = (value: number) => height - (value / maximum) * (height - 4) - 1;
        let line = '';
        values.forEach((value, index) => {
          line += `${index ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`;
        });
        const area = `${line}L${x(values.length - 1).toFixed(1)} ${height}L${x(0).toFixed(1)} ${height}Z`;
        return (
          <>
            <Path d={area} fill={colorOnBlack(colour, 0.22)} />
            <Path
              d={line}
              stroke={colour}
              strokeWidth={1.6}
              strokeLinejoin="round"
              fill="none"
            />
            {values[peak] > 0 && (
              <Circle cx={x(peak)} cy={y(values[peak])} r={3} fill={colour} />
            )}
          </>
        );
      }}
    />
  );
}
