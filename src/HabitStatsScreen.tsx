import { PeriodProgress } from './PeriodProgress';
import { summarizeCompletion } from './completionStatistics';
import type { EntryValues } from './entries';
import { GoalSummary } from './GoalSummary';
import { evaluateGoal, checkboxChecked } from './habitGoals';
import { Text, useAppWindowDimensions } from './Typography';
import { weekDayOrder, type WeekStart } from './displayPreferences';
import { memo, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatsChart } from './StatsChart';
import {
  formatStatistic as format,
  statisticDateLabel as dateLabel,
} from './statisticsFormatting';
import type { Habit } from './habits';
import type { HistoryAction, StoredEvent } from './storage/model';
import { timeOfDayStatistics } from './timeOfDay';
import { TimeOfDayChart } from './TimeOfDayChart';
import { habitStatistics, monthDays, type StatsRange } from './statistics';
import { InfoNote } from './InfoNote';
import { checkmarkColor, colorOnBlack } from './colors';
import { entryDay, type EntryDay } from './calendar';
import { useSheetScroll } from './SheetModal';

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
  actions,
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
  actions: HistoryAction[];
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
  const timeOfDay = useMemo(
    () =>
      timeOfDayStatistics(
        habit,
        values,
        actions,
        stats.start > stats.trackingStart ? stats.start : stats.trackingStart,
        today,
      ),
    [habit, values, actions, stats.start, stats.trackingStart, today],
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
  const sheetScroll = useSheetScroll();
  return (
    <ScrollView
      {...sheetScroll}
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
              ? `${stats.successes} of ${stats.eligible} days successful`
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
      <PeriodProgress data={stats.periodGoals} colour={habit.color} />
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
                label={
                  stats.periodGoals.current ? 'Daily condition met' : 'Goal met'
                }
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
        {!stats.periodGoals.current && (
          <>
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
          </>
        )}
      </View>
      {stats.numeric &&
        (stats.completion.active || stats.completion.eligible > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Days meeting the condition</Text>
            <StatsChart
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
          {stats.numeric ? 'Daily totals' : 'Successful days'}
        </Text>
        {stats.bucketDays > 1 && (
          <Text style={styles.caption}>
            {`Up to ${stats.bucketDays} days per bar${stats.numeric ? ' · totals added together' : ''}`}
          </Text>
        )}
        <StatsChart
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
        {!stats.recorded && !stats.successes && (
          <Text style={styles.caption}>Nothing recorded in this period.</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>
          By day of the week
        </Text>
        <Text style={styles.caption}>
          {stats.numeric ? 'Average per day' : 'Successful days (%)'}
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
      <TimeOfDayChart
        key={`${habit.id}-${range}`}
        stats={timeOfDay}
        colour={habit.color}
        sectionStyle={styles.section}
        headingStyle={styles.sectionTitle}
      />
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
            const recorded = stats.numeric
              ? value !== undefined
              : checkboxChecked(habit, value, day);
            const goal = evaluateGoal(habit, value, day);
            const date = entryDay(day);
            const highlighted = stats.numeric ? recorded : goal.met;
            const background = highlighted
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
                accessibilityLabel={`${habit.name}, ${date.fullLabel}${day === today ? ', today' : ''}${day > today ? ', future date' : ''}, ${recorded ? (stats.numeric ? `${format(value ?? null)} ${unit}` : 'checked') : stats.numeric ? 'not recorded' : 'unchecked'}, ${goal.active ? (goal.met ? 'goal met' : recorded ? 'goal not met' : 'not recorded') : 'tracking only'}${!goal.scheduled && goal.active ? ', not scheduled' : ''}`}
                accessibilityHint={
                  stats.numeric ? 'Edit daily total' : 'Toggle checkbox'
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
                      color: highlighted
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
