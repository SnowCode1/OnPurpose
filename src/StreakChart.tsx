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
import { timeTicks, type StreakRun } from './statsSeries';

const BAR = 26;

/**
 * Streaks as a timeline: each bar spans the days a streak lasted, gaps are
 * breaks, so a 5-day and a 500-day streak read equally well. Below it, the
 * best streaks of all time with their dates.
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
  const amount = (value: number) =>
    `${value} ${value === 1 ? noun.replace(/s$/, '') : noun}`;
  const dates = (run: StreakRun) =>
    statisticSpanLabel(dateKey(run.from), dateKey(run.to), today);
  const visible = runs.filter((run) => run.to >= from && run.from <= to);
  const slots: ChartSlot[] = visible.map((run) => ({
    key: `${run.from}`,
    x0: (Math.max(run.from, from) - from) / span,
    x1: (Math.min(run.to, to) + 1 - from) / span,
    title: dates(run),
    value: `${amount(run.length)}${run.ongoing ? ' · ongoing' : ''}`,
  }));
  const best = [...runs]
    .sort((a, b) => b.length - a.length || b.to - a.to)
    .slice(0, 3);
  const longest = best[0]?.length ?? 0;
  const ink = checkmarkColor(colour);
  return (
    <View style={{ gap: 14 }}>
      <ChartFrame
        name="Streak timeline"
        colour={colour}
        slots={slots}
        height={BAR + 4}
        axis={[]}
        ticks={timeTicks(from, to, weekStart).map((tick) => ({
          x: (tick.day - from) / span,
          label: statisticTickLabel(dateKey(tick.day), tick.kind),
        }))}
        legend={
          visible.length
            ? 'Each bar is a streak · gaps are breaks'
            : 'No streak in this period'
        }
        draw={({ width, selected }) => (
          <>
            <Defs>
              <LinearGradient id="streak-earlier" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#141414" stopOpacity={1} />
                <Stop offset="1" stopColor="#141414" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect
              x={0}
              y={2}
              width={width}
              height={BAR}
              rx={7}
              fill="#141414"
            />
            {visible.map((run, index) => {
              const x0 = slots[index].x0 * width,
                x1 = slots[index].x1 * width,
                barWidth = Math.max(2, x1 - x0 - 1.5),
                faded = selected !== null && selected !== index,
                fill = run.ongoing ? colour : colorOnBlack(colour, 0.72);
              return (
                <Rect
                  key={run.from}
                  x={x0}
                  y={2}
                  width={barWidth}
                  height={BAR}
                  rx={Math.min(7, barWidth / 2)}
                  fill={fill}
                  opacity={faded ? 0.45 : 1}
                />
              );
            })}
            {visible.map((run, index) =>
              // A streak that began before this window fades in from its edge.
              run.from < from ? (
                <Rect
                  key={`earlier:${run.from}`}
                  x={0}
                  y={2}
                  width={Math.min(28, slots[index].x1 * width)}
                  height={BAR}
                  rx={7}
                  fill="url(#streak-earlier)"
                />
              ) : null,
            )}
            {visible.map((run, index) => {
              const label = String(run.length),
                barWidth = (slots[index].x1 - slots[index].x0) * width;
              return barWidth >= 12 + label.length * 7 ? (
                <SvgText
                  key={`label:${run.from}`}
                  x={slots[index].x1 * width - 7}
                  y={2 + BAR / 2 + 4}
                  fontSize={11}
                  fontWeight="700"
                  textAnchor="end"
                  fill={
                    run.ongoing
                      ? ink
                      : checkmarkColor(colorOnBlack(colour, 0.72))
                  }
                >
                  {label}
                </SvgText>
              ) : null;
            })}
          </>
        )}
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
                    backgroundColor: run.ongoing
                      ? colour
                      : colorOnBlack(colour, 0.72),
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
