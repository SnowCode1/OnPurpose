import { useEffect, useMemo, useState, type ComponentType } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextProps,
} from 'react-native';
import Animated, {
  ReduceMotion,
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import Svg, { Line, Rect } from 'react-native-svg';
import type { Habit } from './habits';
import type { StoredEvent } from './storage/model';
import {
  habitStatistics,
  monthDays,
  type StatsBucket,
  type StatsRange,
} from './statistics';
import { Icon } from './Icon';
import { HabitSymbol } from './HabitSymbol';
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
const entering = SlideInRight.duration(230).reduceMotion(ReduceMotion.System);
const exiting = SlideOutRight.duration(190).reduceMotion(ReduceMotion.System);

function Chart({
  buckets,
  colour,
  numeric,
  unit,
}: {
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
    ? Math.max(1, ...buckets.map((bucket) => bucket.value ?? 0))
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
      : `${format(current.value)}${numeric ? (unit ? ` ${unit}` : '') : '% completed'}`
    : 'Tap it again to clear';
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.small}>
        {numeric ? unit || 'total' : 'completion (%)'}
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
      <Text style={[styles.metricValue, { color: colour ?? '#E5E5E5' }]}>
        {value}
      </Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}
export function HabitStatsScreen({
  habit,
  values,
  events,
  today,
  Heading,
  onBack,
  onEdit,
  onCellPress,
  editable,
}: {
  habit: Habit;
  values: Record<string, number>;
  events: StoredEvent[];
  today: string;
  Heading: ComponentType<TextProps>;
  onBack: () => void;
  onEdit: () => void;
  onCellPress: (habit: Habit, day: EntryDay) => void;
  editable: boolean;
}) {
  const [range, setRange] = useState<StatsRange>(30);
  const [month, setMonth] = useState(today.slice(0, 7));
  const stats = useMemo(
    () => habitStatistics(habit, values, events, today, range),
    [habit, values, events, today, range],
  );
  const calendar = monthDays(month);
  const monthMax = Math.max(
    1,
    ...calendar.days.map((day) => values[`${habit.id}:${day}`] ?? 0),
  );
  const unit = habit.unit ?? '';
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => listener.remove();
  }, [onBack]);
  function changeMonth(delta: number) {
    setMonth((previous) => {
      const date = new Date(`${previous}-01T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + delta);
      return date.toISOString().slice(0, 7);
    });
  }
  const difference =
    stats.rate !== null && stats.previous.rate !== null
      ? (stats.rate - stats.previous.rate) * 100
      : null;
  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      style={styles.screen}
      accessibilityViewIsModal
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to habit grid"
          style={styles.nav}
        >
          <Text style={styles.navText}>‹ Back</Text>
        </Pressable>
        <Heading accessibilityRole="header" style={styles.headerTitle}>
          Statistics
        </Heading>
        <Pressable
          onPress={onEdit}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${habit.name}`}
          accessibilityState={{ disabled: !editable }}
          style={[
            styles.nav,
            { alignItems: 'flex-end', opacity: editable ? 1 : 0.35 },
          ]}
        >
          <Icon name="edit" />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <HabitSymbol icon={habit.icon} colour={habit.color} size={30} />
            <Heading
              accessibilityRole="header"
              style={[styles.name, { color: habit.color, flex: 1 }]}
            >
              {habit.name}
            </Heading>
          </View>
          <Text style={styles.caption}>
            {stats.numeric
              ? `Daily total${unit ? ` · ${unit}` : ''}`
              : 'Daily checkbox'}{' '}
            · Since {dateLabel(stats.trackingStart, true)}
          </Text>
        </View>
        <View accessibilityRole="tablist" style={styles.ranges}>
          {([30, 90, 365, 'all'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityLabel={
                value === 'all' ? 'All time' : `Last ${value} days`
              }
              accessibilityState={{ selected: range === value }}
              onPress={() => setRange(value)}
              style={[
                styles.range,
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
                {value === 'all' ? 'All' : value === 365 ? '1Y' : `${value}D`}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ gap: 6 }}>
          <Text style={styles.eyebrow}>
            {stats.numeric ? 'TOTAL RECORDED' : 'COMPLETION RATE'}
          </Text>
          <Text style={[styles.hero, { color: habit.color }]}>
            {stats.numeric
              ? format(stats.recorded ? stats.total : null)
              : stats.rate === null
                ? '—'
                : `${Math.round(stats.rate * 100)}%`}
          </Text>
          <Text style={styles.caption}>
            {stats.numeric
              ? `${unit ? `${unit} · ` : ''}${stats.recorded} days recorded`
              : `${stats.successes} completed of ${stats.eligible} tracking days`}
          </Text>
          {!stats.numeric && range !== 'all' && difference !== null && (
            <Text style={styles.small}>
              {difference > 0 ? '+' : ''}
              {format(difference)} percentage points vs previous period
            </Text>
          )}
        </View>
        <View style={styles.metrics}>
          <Metric
            value={format(stats.numeric ? stats.average : stats.streak)}
            label={
              stats.numeric
                ? `Average / recorded day${unit ? ` (${unit})` : ''}`
                : 'Current streak · days'
            }
          />
          <Metric
            value={format(stats.numeric ? stats.best : stats.bestStreak)}
            label={
              stats.numeric
                ? `Highest daily total${unit ? ` (${unit})` : ''}`
                : 'Best streak · all time'
            }
          />
          <Metric
            value={format(stats.numeric ? stats.streak : stats.successes)}
            label={
              stats.numeric
                ? 'Logging streak · days'
                : 'Completions · selected period'
            }
          />
          <Metric
            value={format(stats.numeric ? stats.recorded : stats.eligible)}
            label={
              stats.numeric
                ? 'Days recorded · selected period'
                : 'Tracking days · selected period'
            }
          />
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {stats.numeric ? 'Recorded totals' : 'Consistency over time'}
          </Text>
          <Text style={styles.caption}>
            {stats.bucketDays === 1
              ? 'One bar per day'
              : `Each bar covers up to ${stats.bucketDays} days${stats.numeric ? ' · added together' : ''}`}
          </Text>
          <Chart
            key={`${habit.id}-${range}-${today}`}
            buckets={stats.buckets}
            colour={habit.color}
            numeric={stats.numeric}
            unit={unit}
          />
          {!stats.recorded && (
            <Text style={styles.caption}>
              Your records will bring this chart to life.
            </Text>
          )}
        </View>
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            By day of the week
          </Text>
          <Text style={styles.caption}>
            {stats.numeric ? 'Average on recorded days' : 'Completion rate'}
            {stats.numeric && unit ? ` · ${unit}` : ''} · selected period
          </Text>
          {stats.weekday.map((day, index) => {
            const maximum = stats.numeric
              ? Math.max(1, ...stats.weekday.map((item) => item.value ?? 0))
              : 100;
            const label = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][
              index
            ];
            return (
              <View
                key={day.day}
                accessible
                accessibilityLabel={`${label}, ${day.value === null ? 'no records' : `${format(day.value)}${stats.numeric ? ` ${unit}` : '%'}`}`}
                style={styles.weekday}
              >
                <Text style={[styles.small, { width: 34 }]}>{label}</Text>
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
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((label, index) => (
              <Text key={index} style={styles.calendarHeading}>
                {label}
              </Text>
            ))}
            {Array.from({ length: calendar.padding }, (_, index) => (
              <View key={`blank-${index}`} style={styles.day} />
            ))}
            {calendar.days.map((day) => {
              const value = values[`${habit.id}:${day}`];
              const recorded = stats.numeric
                ? value !== undefined
                : value === 1;
              const date = entryDay(day);
              const background = recorded
                ? colorOnBlack(
                    habit.color,
                    stats.numeric ? 0.35 + (0.65 * value) / monthMax : 1,
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
                  accessibilityLabel={`${habit.name}, ${date.fullLabel}${day === today ? ', today' : ''}${day > today ? ', future date' : ''}, ${recorded ? (stats.numeric ? `${format(value)} ${unit}` : 'completed') : 'not recorded'}`}
                  accessibilityHint={
                    stats.numeric ? 'Edit daily total' : 'Toggle completion'
                  }
                  disabled={!editable}
                  onPress={() => onCellPress(habit, date)}
                  style={({ pressed }) => [
                    styles.day,
                    { opacity: pressed ? 0.6 : 1 },
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
          <Text style={styles.caption}>
            {stats.numeric
              ? 'Tap a day to edit its total. Brighter days have higher totals; zero still has colour.'
              : 'Tap a day to check or uncheck it. Coloured days are completed.'}
          </Text>
        </View>
        <Text style={styles.note}>
          {stats.numeric
            ? 'Averages use recorded days, including zero. Blank days are not treated as zero. A logging streak counts consecutive days with an entry.'
            : 'Rates assume a daily habit. Days before tracking began and unrecorded days while archived are excluded. Today counts once completed. Streaks count consecutive calendar days; an unfinished today does not break the current streak.'}{' '}
          Future entries are excluded from charts and statistics.
        </Text>
      </ScrollView>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  screen: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    minHeight: 56,
    gap: 8,
  },
  nav: { minHeight: 44, minWidth: 64, justifyContent: 'center' },
  navText: { color: '#D0D0D0', fontSize: 18 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  body: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: 24,
    paddingBottom: 40,
    gap: 28,
  },
  name: { fontSize: 32, fontWeight: '600', letterSpacing: -0.8 },
  caption: { color: '#989898', fontSize: 13, lineHeight: 19 },
  small: {
    color: '#858585',
    fontSize: 12,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  ranges: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 13,
    backgroundColor: '#171717',
  },
  range: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: '#919191',
    fontSize: 11,
    letterSpacing: 1.3,
    fontWeight: '600',
  },
  hero: {
    fontSize: 58,
    fontWeight: '600',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: {
    flexBasis: '45%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#141414',
    gap: 6,
  },
  metricValue: {
    fontSize: 27,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  section: {
    gap: 14,
    paddingTop: 24,
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
  monthButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { color: '#747474', fontSize: 12, lineHeight: 19 },
});
