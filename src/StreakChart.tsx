import { StyleSheet, View } from 'react-native';
import {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Text } from './Typography';
import { ChartFrame, type ChartSlot } from './ChartFrame';
import { checkmarkColor, colorOnBlack } from './colors';
import type { WeekStart } from './displayPreferences';
import { dateKey } from './statistics';
import { statisticSpanLabel, statisticTickLabel } from './statisticsFormatting';
import {
  streakRows,
  timeTicks,
  type StreakRow as Row,
  type StreakRun,
} from './statsSeries';

const TRACK = '#141414';

/**
 * Streaks as a timeline: each bar spans the days a streak lasted and gaps are
 * breaks, so a 5-day and a 500-day streak read equally well. Longer windows
 * stack rows by month or quarter. Below it, the best streaks of all time.
 */
export function StreakChart({
  colour,
  runs,
  noun,
  from,
  to,
  today,
  weekStart,
}: {
  colour: string;
  /** Every streak in the habit's history, oldest first. */
  runs: StreakRun[];
  /** Plural unit, e.g. "days" or "weeks". */
  noun: string;
  from: number;
  to: number;
  today: string;
  weekStart: WeekStart;
}) {
  const span = to - from + 1;
  const { unit, rows } = streakRows(from, to);
  const bar = unit === 'window' ? 26 : 18,
    gap = 8,
    height = rows.length * bar + (rows.length - 1) * gap + 4;
  const top = (row: number) => 2 + row * (bar + gap);
  const amount = (value: number) =>
    `${value} ${value === 1 ? noun.replace(/s$/, '') : noun}`;
  const dates = (run: StreakRun) =>
    statisticSpanLabel(dateKey(run.from), dateKey(run.to), today);
  type Segment = {
    run: StreakRun;
    row: number;
    from: number;
    to: number;
    last: boolean;
  };
  const segments: Segment[] = [];
  for (const run of runs) {
    if (run.to < from || run.from > to) continue;
    rows.forEach((row, index) => {
      const a = Math.max(run.from, row.from),
        b = Math.min(run.to, row.to);
      if (a <= b)
        segments.push({
          run,
          row: index,
          from: a,
          to: b,
          last: b === Math.min(run.to, to),
        });
    });
  }
  const x = (row: Row, day: number) => (day - row.start) / row.scale;
  const slots: ChartSlot[] = segments.map((segment) => ({
    key: `${segment.run.from}`,
    x0: x(rows[segment.row], segment.from),
    x1: x(rows[segment.row], segment.to + 1),
    y0: top(segment.row) / height,
    y1: (top(segment.row) + bar) / height,
    title: dates(segment.run),
    value: `${amount(segment.run.length)}${segment.run.ongoing ? ' · ongoing' : ''}`,
  }));
  const ticks =
    unit === 'window'
      ? timeTicks(from, to, weekStart).map((tick) => ({
          x: (tick.day - from) / span,
          label: statisticTickLabel(dateKey(tick.day), tick.kind),
        }))
      : unit === 'month'
        ? [1, 8, 15, 22, 29].map((day) => ({
            x: (day - 1) / 31,
            label: String(day),
          }))
        : [0, 31, 61].map((day) => ({ x: day / 92, label: '' }));
  const best = [...runs]
    .sort((a, b) => b.length - a.length || b.to - a.to)
    .slice(0, 3);
  const longest = best[0]?.length ?? 0;
  const faded = colorOnBlack(colour, 0.72);
  return (
    <View style={{ gap: 14 }}>
      <ChartFrame
        name="Streak timeline"
        colour={colour}
        slots={slots}
        height={height}
        gridLines={false}
        axisWidth={unit === 'quarter' ? 54 : 60}
        axis={
          unit === 'window'
            ? []
            : rows.map((row, index) => ({
                y: (top(index) + bar / 2) / height,
                label: row.label,
              }))
        }
        ticks={ticks}
        legend={
          segments.length
            ? `Each bar is a streak · gaps are breaks${unit === 'month' ? ' · a row per month' : unit === 'quarter' ? ' · a row per quarter' : ''}`
            : 'No streak in this period'
        }
        draw={({ width, selectedKey }) => {
          const px = (row: Row, day: number) => x(row, day) * width;
          return (
            <>
              <Defs>
                <LinearGradient id="streak-earlier" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={TRACK} stopOpacity={1} />
                  <Stop offset="1" stopColor={TRACK} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {rows.map((row, index) => (
                <Rect
                  key={`track:${index}`}
                  x={px(row, row.from)}
                  y={top(index)}
                  width={Math.max(1, px(row, row.to + 1) - px(row, row.from))}
                  height={bar}
                  rx={bar / 3.5}
                  fill={TRACK}
                />
              ))}
              {segments.map((segment) => {
                const row = rows[segment.row],
                  x0 = px(row, segment.from),
                  x1 = px(row, segment.to + 1),
                  w = Math.max(2, x1 - x0 - 1.5),
                  r = Math.min(bar / 3.5, w / 2),
                  y = top(segment.row),
                  fill = segment.run.ongoing ? colour : faded,
                  opacity =
                    selectedKey !== null &&
                    selectedKey !== `${segment.run.from}`
                      ? 0.45
                      : 1;
                // Square the ends where the streak continues on another row.
                const continuesLeft = segment.from > segment.run.from,
                  continuesRight = segment.to < segment.run.to;
                return [
                  <Rect
                    key={`bar:${segment.run.from}:${segment.row}`}
                    x={x0}
                    y={y}
                    width={w}
                    height={bar}
                    rx={r}
                    fill={fill}
                    opacity={opacity}
                  />,
                  continuesLeft && segment.from > from ? (
                    <Rect
                      key={`left:${segment.run.from}:${segment.row}`}
                      x={x0}
                      y={y}
                      width={Math.min(r, w)}
                      height={bar}
                      fill={fill}
                      opacity={opacity}
                    />
                  ) : null,
                  continuesRight ? (
                    <Rect
                      key={`right:${segment.run.from}:${segment.row}`}
                      x={x0 + w - Math.min(r, w)}
                      y={y}
                      width={Math.min(r, w) + 1.5}
                      height={bar}
                      fill={fill}
                      opacity={opacity}
                    />
                  ) : null,
                  // A streak that began before this window fades in.
                  segment.from === from && segment.run.from < from ? (
                    <Rect
                      key={`earlier:${segment.run.from}`}
                      x={x0}
                      y={y}
                      width={Math.min(28, w)}
                      height={bar}
                      rx={r}
                      fill="url(#streak-earlier)"
                    />
                  ) : null,
                ];
              })}
              {segments.map((segment) => {
                const row = rows[segment.row],
                  label = String(segment.run.length),
                  w = px(row, segment.to + 1) - px(row, segment.from),
                  size = unit === 'window' ? 11 : 10;
                return segment.last && w >= 10 + label.length * size * 0.62 ? (
                  <SvgText
                    key={`label:${segment.run.from}`}
                    x={px(row, segment.to + 1) - 6}
                    y={top(segment.row) + bar / 2 + size * 0.36}
                    fontSize={size}
                    fontWeight="700"
                    textAnchor="end"
                    fill={checkmarkColor(segment.run.ongoing ? colour : faded)}
                  >
                    {label}
                  </SvgText>
                ) : null;
              })}
            </>
          );
        }}
      />
      {best.length > 0 && (
        <View style={{ gap: 8 }}>
          <Text style={styles.heading}>Best streaks</Text>
          {best.map((run) => (
            <View
              key={run.from}
              accessible
              accessibilityLabel={`${amount(run.length)}, ${dates(run)}${run.ongoing ? ', ongoing' : ''}`}
              style={styles.row}
            >
              <View style={styles.track}>
                <View
                  style={{
                    width: `${(run.length / longest) * 100}%`,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: run.ongoing ? colour : faded,
                  }}
                />
              </View>
              <Text style={styles.length}>{amount(run.length)}</Text>
              <Text numberOfLines={1} style={styles.dates}>
                {dates(run)}
                {run.ongoing ? ' · ongoing' : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: '#9A9A9A', fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 },
  track: { width: 64, height: 6, borderRadius: 3, backgroundColor: '#1E1E1E' },
  length: {
    width: 74,
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  dates: { flex: 1, color: '#8E8E8E', fontSize: 13 },
});
