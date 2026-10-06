import { summarizeCompletion } from './completionStatistics';
import type { EntryValues } from './entries';
import { GoalSummary } from './GoalSummary';
import { evaluateGoal } from './habitGoals';
import { Text, useAppWindowDimensions } from './Typography';
import { weekDayOrder, type WeekStart } from './displayPreferences';
import { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import type { Habit } from './habits';
import type { StoredEvent } from './storage/model';
import {
  habitStatistics,
  monthDays,
  type StatsBucket,
  type StatsRange,
} from './statistics';
import { InfoNote } from './InfoNote';
import { checkmarkColor, colorOnBlack } from './colors';
import { entryDay, type EntryDay } from './calendar';

const format = (value: number | null) =>
  value === null
    ? '—'
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const dateLabel = (key: string, withYear = false) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });

export function Chart({
  buckets,
  colour,
  numeric,
  unit,
  recording = false,
  targets,
}: {
  recording?: boolean;
  targets?: number[][];
  buckets: StatsBucket[];
  colour: string;
  numeric: boolean;
  unit: string;
}) {
  const [width, setWidth] = useState(300);
  // Date identity prevents a correction/backdated entry moving selection to a
  // different period when All-time bucket boundaries change.
  const [selected, setSelected] = useState<string | null>(null);
  const bucketKey = (bucket: StatsBucket) => `${bucket.start}:${bucket.end}`;
  const selectedIndex = buckets.findIndex(
    (bucket) => bucketKey(bucket) === selected,
  );
  const current = buckets[selectedIndex];
  const max = numeric
    ? Math.max(
        1,
        ...buckets.map((bucket) => bucket.value ?? 0),
        ...(targets?.flat() ?? []),
      )
    : 100;
  const step = width / Math.max(1, buckets.length);
  const showYear =
    buckets[0]?.start.slice(0, 4) !== buckets.at(-1)?.end.slice(0, 4);
  const period = current
    ? `${dateLabel(current.start, showYear)}${current.end !== current.start ? ` – ${dateLabel(current.end, showYear)}` : ''}`
    : 'Tap a bar to inspect';
  const value = current
    ? current.value === null
      ? 'No records'
      : `${format(current.value)}${numeric ? (unit ? ` ${unit}` : '') : recording ? '% recorded' : '% completed'}`
    : 'Tap it again to clear';
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.small}>
        {numeric
          ? unit || 'total'
          : recording
            ? 'days recorded (%)'
            : 'completion (%)'}
      </Text>
      <View style={styles.chartPlot}>
        <View style={styles.chartScale} accessible={false}>
          <Text style={styles.small}>{format(max)}</Text>
          <Text style={styles.small}>0</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 8 }}>
          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="Trend chart"
            accessibilityValue={{
              text: current ? `${period}: ${value}` : 'No period selected',
            }}
            accessibilityHint="Adjust to inspect periods. Use Clear selection to show all bars."
            accessibilityActions={[
              { name: 'increment', label: 'Next period' },
              { name: 'decrement', label: 'Previous period' },
              { name: 'clearSelection', label: 'Clear selection' },
            ]}
            onAccessibilityAction={(event) => {
              const action = event.nativeEvent.actionName;
              if (action === 'clearSelection') setSelected(null);
              else if (action === 'increment' || action === 'decrement') {
                const index =
                  selectedIndex < 0
                    ? action === 'increment'
                      ? 0
                      : buckets.length - 1
                    : Math.max(
                        0,
                        Math.min(
                          buckets.length - 1,
                          selectedIndex + (action === 'increment' ? 1 : -1),
                        ),
                      );
                setSelected(buckets[index] ? bucketKey(buckets[index]) : null);
              }
            }}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            onPress={(event) => {
              if (!buckets.length || width <= 0) return;
              const index = Math.max(
                0,
                Math.min(
                  buckets.length - 1,
                  Math.floor(event.nativeEvent.locationX / step),
                ),
              );
              const key = bucketKey(buckets[index]);
              setSelected((previous) => (previous === key ? null : key));
            }}
            style={{ height: 154 }}
          >
            <Svg
              width={width}
              height={154}
              pointerEvents="none"
              accessible={false}
            >
              {[2, 76, 150].map((y) => (
                <Line
                  key={y}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="#242424"
                  strokeWidth={1}
                />
              ))}
              {current && (
                <Rect
                  x={selectedIndex * step}
                  y={0}
                  width={step}
                  height={152}
                  rx={3}
                  fill={colour}
                  opacity={0.08}
                />
              )}
              {numeric &&
                targets?.flatMap((levels, index) =>
                  levels.map((target, level) => (
                    <Line
                      key={`target-${index}-${level}`}
                      x1={index * step + step * 0.08}
                      x2={(index + 1) * step - step * 0.08}
                      y1={150 - (target / max) * 148}
                      y2={150 - (target / max) * 148}
                      stroke={colour}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      opacity={0.6}
                    />
                  )),
                )}
              {buckets.map(
                (bucket, index) =>
                  bucket.value !== null && (
                    <Rect
                      key={bucketKey(bucket)}
                      x={index * step + step * 0.16}
                      y={150 - Math.max(2, (bucket.value / max) * 148)}
                      width={Math.max(1, step * 0.68)}
                      height={Math.max(2, (bucket.value / max) * 148)}
                      rx={Math.min(3, step * 0.2)}
                      fill={colour}
                      opacity={!current || selectedIndex === index ? 0.9 : 0.35}
                    />
                  ),
              )}
            </Svg>
          </Pressable>
          {!!buckets.length && (
            <View style={[styles.axis, { alignItems: 'flex-start' }]}>
              <Text style={[styles.small, { flex: 1 }]}>
                {dateLabel(buckets[0].start, showYear)}
              </Text>
              <Text style={[styles.small, { flex: 1, textAlign: 'right' }]}>
                {dateLabel(buckets.at(-1)!.end, showYear)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.chartDetail}>
        <View style={{ flex: 1, gap: 2 }} accessibilityLiveRegion="polite">
          <Text style={styles.caption}>{period}</Text>
          <Text style={[styles.small, current && { color: colour }]}>
            {value}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear chart selection"
          accessibilityElementsHidden={!current}
          importantForAccessibility={current ? 'auto' : 'no-hide-descendants'}
          disabled={!current}
          onPress={() => setSelected(null)}
          style={({ pressed }) => [
            styles.clearSelection,
            { opacity: !current ? 0 : pressed ? 0.5 : 1 },
          ]}
        >
          <Text style={styles.caption}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({
  value,
  label,
  colour,
}: {
  value: string;
  label: string;
  colour?: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={[styles.caption, { flex: 1 }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: colour ?? '#E5E5E5' }]}>
        {value}
      </Text>
    </View>
  );
}
export const HabitStatsScreen = memo(function HabitStatsScreen({
  habit,
  weekStart,
  values,
  events,
  today,
  onCellPress,
  editable,
  bottomInset = 40,
  onGoalEdit,
}: {
  habit: Habit;
  weekStart: WeekStart;
  values: EntryValues;
  events: StoredEvent[];
  today: string;
  onCellPress: (habit: Habit, day: EntryDay) => void;
  editable: boolean;
  bottomInset?: number;
  onGoalEdit: () => void;
}) {
  const { fontScale } = useAppWindowDimensions();
  const calendarHeight = Math.max(44, Math.ceil(44 * fontScale));
  const [range, setRange] = useState<StatsRange>(30);
  const [rangeWidth, setRangeWidth] = useState(0);
  const [month, setMonth] = useState(today.slice(0, 7));
  const stats = useMemo(
    () => habitStatistics(habit, values, events, today, range),
    [habit, values, events, today, range],
  );
  const calendar = monthDays(month, weekStart);
  const weekDays = weekDayOrder(weekStart);
  const monthMax = Math.max(
    1,
    ...calendar.days.map((day) => {
      const value = values[`${habit.id}:${day}`];
      return typeof value === 'number' ? value : 0;
    }),
  );
  const unit = habit.unit ?? '';
  function changeMonth(delta: number) {
    setMonth((previous) => {
      const date = new Date(`${previous}-01T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + delta);
      return date.toISOString().slice(0, 7);
    });
  }
  return (
    <ScrollView
      testID="habit-statistics"
      alwaysBounceVertical
      directionalLockEnabled
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[styles.body, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      <GoalSummary
        habit={habit}
        date={today}
        onPress={onGoalEdit}
        disabled={!editable}
      />
      <Text style={styles.caption}>
        {stats.numeric
          ? `Daily total${unit ? ` · ${unit}` : ''}`
          : 'Daily checkbox'}{' '}
        · {stats.trackingStart > today ? 'Starts' : 'Since'}{' '}
        {dateLabel(stats.trackingStart, true)}
      </Text>
      <View
        accessibilityRole="tablist"
        style={styles.ranges}
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          setRangeWidth((previous) => (previous === width ? previous : width));
        }}
      >
        {([30, 90, 365, 'all'] as const).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityLabel={
              value === 'all' ? 'All time' : `Last ${value} days`
            }
            accessibilityState={{ selected: range === value }}
            aria-selected={range === value}
            onPress={() => setRange(value)}
            style={[
              styles.range,
              {
                flexBasis:
                  rangeWidth > 0 && (rangeWidth - 20) / 4 < 78 * fontScale
                    ? '46%'
                    : '20%',
              },
              range === value && { backgroundColor: '#303030' },
            ]}
          >
            <Text
              style={{
                color: range === value ? '#FFFFFF' : '#969696',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              {value === 'all'
                ? 'All time'
                : value === 365
                  ? 'Year'
                  : `${value} days`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Text style={styles.small}>
          {stats.eligible
            ? `${dateLabel(stats.start, stats.start.slice(0, 4) !== today.slice(0, 4))} – ${dateLabel(today, stats.start.slice(0, 4) !== today.slice(0, 4))}`
            : `Starts ${dateLabel(stats.trackingStart, true)}`}
        </Text>
        <Text style={styles.summary}>
          {stats.numeric
            ? stats.recorded
              ? `${format(stats.total)}${unit ? ` ${unit}` : ''} recorded`
              : 'Nothing recorded in this period'
            : stats.eligible
              ? `${stats.successes} of ${stats.eligible} days checked`
              : 'No days in this period yet'}
        </Text>
        <Text style={styles.caption}>
          {stats.numeric
            ? `${stats.recorded} days with an entry${stats.eligible ? ` · ${stats.eligible} days in this period` : ''}`
            : stats.rate === null
              ? 'Your records will appear here.'
              : `${Math.round(stats.rate * 100)}% of days in this period`}
        </Text>
      </View>
      <View style={styles.metrics}>
        {stats.numeric && (
          <>
            {(stats.completion.active || stats.completion.eligible > 0) && (
              <Metric
                value={
                  stats.completion.eligible
                    ? `${stats.completion.successes} of ${stats.completion.eligible} days`
                    : '—'
                }
                label="Goal met"
              />
            )}
            <Metric
              value={`${format(stats.average)}${unit ? ` ${unit}` : ''}`}
              label="Average per day"
            />
            <Metric
              value={`${format(stats.recorded ? stats.best : null)}${unit ? ` ${unit}` : ''}`}
              label="Highest daily total"
            />
          </>
        )}
        <Metric
          value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
          label={
            stats.numeric && !stats.completion.active
              ? 'Days recorded in a row'
              : 'Current success streak'
          }
        />
        <Metric
          value={`${stats.bestStreak} ${stats.bestStreak === 1 ? 'day' : 'days'}`}
          label="Longest streak · all time"
        />
      </View>
      {stats.numeric &&
        (stats.completion.active || stats.completion.eligible > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Days meeting the goal</Text>
            <Chart
              buckets={stats.buckets.map((bucket) => {
                const goal = summarizeCompletion(
                  stats.completion,
                  bucket.start,
                  bucket.end,
                );
                return {
                  ...bucket,
                  eligible: goal.eligible,
                  value: goal.rate === null ? null : goal.rate * 100,
                };
              })}
              colour={habit.color}
              numeric={false}
              unit=""
            />
          </View>
        )}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          {stats.numeric ? 'Daily totals' : 'Days checked'}
        </Text>
        {stats.bucketDays > 1 && (
          <Text style={styles.caption}>
            {`Up to ${stats.bucketDays} days per bar${stats.numeric ? ' · totals added together' : ''}`}
          </Text>
        )}
        <Chart
          key={`${habit.id}-${range}-${today}`}
          buckets={stats.buckets}
          colour={habit.color}
          numeric={stats.numeric}
          unit={unit}
          targets={
            stats.numeric && stats.bucketDays === 1
              ? stats.buckets.map((bucket) => {
                  const goal = evaluateGoal(habit, undefined, bucket.start);
                  return goal.scheduled && goal.rule.kind === 'number'
                    ? goal.rule.operator === 'between'
                      ? [goal.rule.target, goal.rule.upper!]
                      : [goal.rule.target]
                    : [];
                })
              : undefined
          }
        />
        {stats.numeric &&
          stats.bucketDays === 1 &&
          habit.goals?.some((goal) => goal.rule.kind === 'number') && (
            <Text style={styles.caption}>
              Dashed marks show the goal for each scheduled day.
            </Text>
          )}
        {!stats.recorded && (
          <Text style={styles.caption}>Nothing recorded in this period.</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          By day of the week
        </Text>
        <Text style={styles.caption}>
          {stats.numeric ? 'Average per day' : 'Days checked (%)'}
          {stats.numeric && unit ? ` · ${unit}` : ''} · selected period
        </Text>
        {weekDays.map((weekday) => {
          const day = stats.weekday.find((item) => item.day === weekday)!;
          const maximum = stats.numeric
            ? Math.max(1, ...stats.weekday.map((item) => item.value ?? 0))
            : 100;
          const label = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
            day.day
          ];
          return (
            <View
              key={day.day}
              accessible
              accessibilityLabel={`${label}, ${day.value === null ? 'no records' : `${format(day.value)}${stats.numeric ? ` ${unit}` : '%'}`}`}
              style={styles.weekday}
            >
              <Text
                style={[styles.small, { width: 34 * Math.max(1, fontScale) }]}
              >
                {label}
              </Text>
              <View style={styles.track}>
                <View
                  style={{
                    width: `${Math.max(0, ((day.value ?? 0) / maximum) * 100)}%`,
                    height: 5,
                    borderRadius: 3,
                    backgroundColor: habit.color,
                  }}
                />
              </View>
              <Text
                style={[styles.small, { minWidth: 60, textAlign: 'right' }]}
              >
                {format(day.value)}
                {day.value !== null && !stats.numeric ? '%' : ''}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.section}>
        <View style={styles.axis}>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, { flex: 1 }]}
          >
            {new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            accessibilityState={{
              disabled: month <= stats.trackingStart.slice(0, 7),
            }}
            disabled={month <= stats.trackingStart.slice(0, 7)}
            onPress={() => changeMonth(-1)}
            style={[
              styles.monthButton,
              {
                opacity: month <= stats.trackingStart.slice(0, 7) ? 0.25 : 1,
              },
            ]}
          >
            <Text style={styles.navText}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: month >= today.slice(0, 7) }}
            disabled={month >= today.slice(0, 7)}
            onPress={() => changeMonth(1)}
            style={[
              styles.monthButton,
              { opacity: month >= today.slice(0, 7) ? 0.25 : 1 },
            ]}
          >
            <Text style={styles.navText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.calendar}>
          {weekDays.map((day) => (
            <Text
              key={day}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
              style={styles.calendarHeading}
            >
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day]}
            </Text>
          ))}
          {Array.from({ length: calendar.padding }, (_, index) => (
            <View
              key={`blank-${index}`}
              style={[styles.day, { height: calendarHeight }]}
            />
          ))}
          {calendar.days.map((day) => {
            const entry = values[`${habit.id}:${day}`];
            const value = typeof entry === 'number' ? entry : undefined;
            const recorded = stats.numeric ? value !== undefined : value === 1;
            const goal = evaluateGoal(habit, value, day);
            const date = entryDay(day);
            const background = recorded
              ? colorOnBlack(
                  habit.color,
                  stats.numeric
                    ? goal.met
                      ? 0.75
                      : 0.2 + (0.3 * (value ?? 0)) / monthMax
                    : 1,
                )
              : day > today
                ? '#0C0C0C'
                : '#161616';
            return (
              <Pressable
                key={day}
                accessibilityRole={stats.numeric ? 'button' : 'checkbox'}
                accessibilityState={{
                  disabled: !editable,
                  ...(stats.numeric ? {} : { checked: recorded }),
                }}
                accessibilityLabel={`${habit.name}, ${date.fullLabel}${day === today ? ', today' : ''}${day > today ? ', future date' : ''}, ${recorded ? (stats.numeric ? `${format(value ?? null)} ${unit}` : 'checked') : 'not recorded'}, ${goal.active ? (goal.met ? 'goal met' : recorded ? 'goal not met' : 'not recorded') : 'tracking only'}${!goal.scheduled && goal.active ? ', not scheduled' : ''}`}
                accessibilityHint={
                  stats.numeric ? 'Edit daily total' : 'Toggle completion'
                }
                disabled={!editable}
                onPress={() => onCellPress(habit, date)}
                style={({ pressed }) => [
                  styles.day,
                  { minHeight: calendarHeight, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.dayFace,
                    {
                      backgroundColor: background,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                    style={{
                      color: recorded
                        ? checkmarkColor(background)
                        : day > today
                          ? '#606060'
                          : '#A0A0A0',
                      fontSize: 13,
                    }}
                  >
                    {Number(day.slice(-2))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <InfoNote
          label="About the calendar"
          text={
            stats.numeric
              ? 'Tap a day to edit its total. Days meeting their goal are brighter; without a goal, brightness follows the total. Zero is still a recorded value.'
              : 'Tap a day to check or uncheck it. Coloured days are completed.'
          }
        />
      </View>
      <InfoNote
        label="How statistics work"
        text={`${
          stats.numeric
            ? 'Averages divide totals by calendar days since the start, including today and blank days. Blanks stay empty; zero is a recorded total. A logging streak counts consecutive days with an entry.'
            : 'Success rates use scheduled days since the start, including today. Off-days do not break a success streak; an unfinished today has a grace period.'
        } Success uses each day’s effective goal and schedule, with blank days never successful. Numeric averages still include every calendar day. Future entries and records before the start date are excluded from charts and statistics. Earlier records stay saved; edit the start date to include them.`}
      />
    </ScrollView>
  );
});
const styles = StyleSheet.create({
  body: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 20,
  },
  caption: { color: '#989898', fontSize: 13, lineHeight: 19 },
  small: {
    color: '#858585',
    fontSize: 12,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  ranges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    padding: 4,
    borderRadius: 13,
    backgroundColor: '#171717',
  },
  range: {
    flexGrow: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    color: '#E2E2E2',
    fontSize: 22,
    fontWeight: '500',
    lineHeight: 30,
  },
  metrics: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#242424',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 44,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
    maxWidth: '55%',
    textAlign: 'right',
  },
  section: {
    gap: 12,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#282828',
  },
  sectionTitle: { color: '#DDDDDD', fontSize: 18, fontWeight: '600' },
  axis: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chartPlot: { flexDirection: 'row', gap: 10 },
  chartScale: {
    minWidth: 24,
    height: 154,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  clearSelection: {
    minHeight: 44,
    minWidth: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  weekday: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: '#232323' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarHeading: {
    width: '14.2857%',
    textAlign: 'center',
    color: '#777777',
    fontSize: 11,
    paddingBottom: 10,
  },
  day: { width: '14.2857%', padding: 3, minHeight: 44 },
  dayFace: {
    minHeight: 38,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navText: { color: '#D0D0D0', fontSize: 18 },
  monthButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
