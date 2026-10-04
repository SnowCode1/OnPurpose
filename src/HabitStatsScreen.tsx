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
import { checkmarkColor } from './colors';

const format = (value: number | null) =>
  value === null
    ? '—'
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
const dateLabel = (key: string) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
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
  const [selected, setSelected] = useState<number | null>(null);
  const max = numeric
    ? Math.max(1, ...buckets.map((bucket) => bucket.value ?? 0))
    : 100;
  const current =
    selected === null ? null : buckets[Math.min(selected, buckets.length - 1)];
  const step = width / buckets.length;
  const description = current
    ? `${dateLabel(current.start)}${current.end !== current.start ? ` – ${dateLabel(current.end)}` : ''}: ${current.value === null ? 'No records' : `${format(current.value)}${numeric ? ` ${unit}` : '% completed'}`}`
    : 'Tap the chart to inspect a period';
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.axis}>
        <Text style={styles.small}>
          {format(max)}
          {numeric ? '' : '%'}
        </Text>
        <Text style={styles.small}>
          {numeric ? unit || 'total' : 'completion'}
        </Text>
      </View>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Trend chart"
        accessibilityValue={{ text: description }}
        accessibilityActions={[
          { name: 'increment', label: 'Next period' },
          { name: 'decrement', label: 'Previous period' },
        ]}
        onAccessibilityAction={(event) =>
          setSelected((index) =>
            Math.max(
              0,
              Math.min(
                buckets.length - 1,
                (index ?? -1) +
                  (event.nativeEvent.actionName === 'increment' ? 1 : -1),
              ),
            ),
          )
        }
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onPress={(event) =>
          setSelected(
            Math.max(
              0,
              Math.min(
                buckets.length - 1,
                Math.floor(event.nativeEvent.locationX / step),
              ),
            ),
          )
        }
        style={{ height: 154 }}
      >
        <Svg width={width} height={154} pointerEvents="none" accessible={false}>
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
          {buckets.map(
            (bucket, index) =>
              bucket.value !== null && (
                <Rect
                  key={bucket.start}
                  x={index * step + step * 0.16}
                  y={150 - Math.max(2, (bucket.value / max) * 148)}
                  width={Math.max(1, step * 0.68)}
                  height={Math.max(2, (bucket.value / max) * 148)}
                  rx={Math.min(3, step * 0.2)}
                  fill={colour}
                  opacity={selected === null || selected === index ? 0.9 : 0.3}
                />
              ),
          )}
        </Svg>
      </Pressable>
      <View style={styles.axis}>
        <Text style={styles.small}>{dateLabel(buckets[0].start)}</Text>
        <Text style={styles.small}>0 · {dateLabel(buckets.at(-1)!.end)}</Text>
      </View>
      <Text accessibilityLiveRegion="polite" style={styles.caption}>
        {description}
      </Text>
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
  editable,
}: {
  habit: Habit;
  values: Record<string, number>;
  events: StoredEvent[];
  today: string;
  Heading: ComponentType<TextProps>;
  onBack: () => void;
  onEdit: () => void;
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
    ...calendar.days.map((day) =>
      day <= today ? (values[`${habit.id}:${day}`] ?? 0) : 0,
    ),
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
          <Heading
            accessibilityRole="header"
            style={[styles.name, { color: habit.color }]}
          >
            {habit.name}
          </Heading>
          <Text style={styles.caption}>
            {stats.numeric
              ? `Daily total${unit ? ` · ${unit}` : ''}`
              : 'Daily checkbox'}{' '}
            · Since {dateLabel(stats.trackingStart)},{' '}
            {stats.trackingStart.slice(0, 4)}
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
            key={`${habit.id}-${range}`}
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
            {stats.numeric ? 'Average on recorded days' : 'Completion rate'} ·
            selected period
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
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
              <Text key={index} style={styles.calendarHeading}>
                {label}
              </Text>
            ))}
            {Array.from({ length: calendar.padding }, (_, index) => (
              <View key={`blank-${index}`} style={styles.day} />
            ))}
            {calendar.days.map((day) => {
              const value =
                day <= today ? values[`${habit.id}:${day}`] : undefined;
              const recorded = value !== undefined;
              return (
                <View
                  key={day}
                  accessible
                  accessibilityLabel={`${dateLabel(day)}, ${day > today ? 'future date' : recorded ? (stats.numeric ? `${format(value)} ${unit}` : 'completed') : 'not recorded'}`}
                  style={styles.day}
                >
                  <View
                    style={[
                      styles.dayFace,
                      {
                        backgroundColor: recorded ? habit.color : '#161616',
                        opacity:
                          day > today
                            ? 0.3
                            : stats.numeric && recorded
                              ? 0.35 + (0.65 * value) / monthMax
                              : 1,
                        borderColor: day === today ? '#FFFFFF' : 'transparent',
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: recorded
                          ? checkmarkColor(habit.color)
                          : '#868686',
                        fontSize: 13,
                      }}
                    >
                      {Number(day.slice(-2))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.caption}>
            {stats.numeric
              ? 'Brighter days have higher totals. A recorded zero still has colour.'
              : 'Coloured days are completed. Today has an outline.'}
          </Text>
        </View>
        <Text style={styles.note}>
          {stats.numeric
            ? 'Averages use recorded days, including zero. Blank days are not treated as zero. A logging streak counts consecutive days with an entry.'
            : 'Rates assume a daily habit. Days before tracking began and unrecorded days while archived are excluded. Today counts once completed. Streaks count consecutive calendar days; an unfinished today does not break the current streak.'}{' '}
          Future entries are excluded.
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
  day: { width: '14.2857%', padding: 3, minHeight: 42 },
  dayFace: {
    minHeight: 36,
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
