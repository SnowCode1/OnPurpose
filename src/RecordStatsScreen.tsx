import { summarizeCompletion } from './completionStatistics';
import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text, useAppWindowDimensions } from './Typography';
import { entryLabel, cellEntryLabel, type EntryValues } from './entries';
import type { Habit } from './habits';
import { habitTypeLabel } from './habits';
import type { StoredEvent } from './storage/model';
import { entryDay, type EntryDay } from './calendar';
import { monthDays, type StatsRange } from './statistics';
import { recordStatistics, type DailyRecord } from './recordStatistics';
import { Chart } from './HabitStatsScreen';
import { weekDayOrder, type WeekStart } from './displayPreferences';
import { colorOnBlack } from './colors';
import { InfoNote } from './InfoNote';
import { GoalSummary } from './GoalSummary';
import { evaluateGoal } from './habitGoals';

export const RecordStatsScreen = memo(function RecordStatsScreen({
  habit,
  values,
  events,
  today,
  weekStart,
  editable,
  onCellPress,
  bottomInset,
  onGoalEdit,
}: {
  habit: Habit;
  values: EntryValues;
  events: StoredEvent[];
  today: string;
  weekStart: WeekStart;
  editable: boolean;
  onCellPress: (habit: Habit, day: EntryDay) => void;
  bottomInset: number;
  onGoalEdit: () => void;
}) {
  const [range, setRange] = useState<StatsRange>(30);
  const [month, setMonth] = useState(today.slice(0, 7));
  const { fontScale } = useAppWindowDimensions();
  const stats = useMemo(
    () => recordStatistics(habit, values, events, today, range),
    [habit, values, events, today, range],
  );
  const calendar = monthDays(month, weekStart),
    weekDays = weekDayOrder(weekStart);
  const changeMonth = (delta: number) =>
    setMonth((previous) => {
      const date = new Date(`${previous}-01T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + delta);
      return date.toISOString().slice(0, 7);
    });
  const dateLabel = (key: string) =>
    new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      ...(key.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
    });
  const header = (
    <View style={styles.header}>
      <GoalSummary
        habit={habit}
        date={today}
        onPress={onGoalEdit}
        disabled={!editable}
      />
      <Text style={styles.caption}>
        {habitTypeLabel(habit)} · since {dateLabel(stats.trackingStart)}
      </Text>
      <View style={styles.ranges}>
        {([30, 90, 365, 'all'] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={
              item === 'all' ? 'All time' : `Last ${item} days`
            }
            accessibilityState={{ selected: range === item }}
            onPress={() => setRange(item)}
            style={[
              styles.range,
              {
                flexBasis: 70 * Math.max(1, fontScale),
                backgroundColor: range === item ? '#303030' : 'transparent',
              },
            ]}
          >
            <Text style={styles.rangeText}>
              {item === 'all'
                ? 'All time'
                : item === 365
                  ? 'Year'
                  : `${item} days`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.section}>
        {(stats.completion.active || stats.completion.eligible > 0) && (
          <>
            <Text style={styles.summary}>
              {stats.completion.successes} of {stats.completion.eligible} days
              meeting the goal
            </Text>
            <View style={styles.metric}>
              <Text style={styles.caption}>Success streak · longest</Text>
              <Text style={styles.metricValue}>
                {stats.completion.streak} · {stats.completion.bestStreak}
              </Text>
            </View>
          </>
        )}
        <Text style={styles.summary}>
          {stats.recorded} of {stats.eligible} days recorded
        </Text>
        <View style={styles.metric}>
          <Text style={styles.caption}>Logging streak</Text>
          <Text style={styles.metricValue}>
            {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.caption}>Longest logging streak · all time</Text>
          <Text style={styles.metricValue}>
            {stats.bestStreak} {stats.bestStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>
      </View>
      {habit.type === 'categorical' && (
        <View style={styles.section}>
          <Text accessibilityRole="header" style={styles.heading}>
            Categories
          </Text>
          {stats.categories
            .filter((option) => !option.archived || option.count)
            .map((option) => (
              <View key={option.id} style={{ gap: 6 }}>
                <View style={styles.metric}>
                  <Text style={[styles.caption, { flex: 1 }]}>
                    {option.label}
                    {option.archived ? ' · archived' : ''}
                  </Text>
                  <Text style={styles.metricValue}>
                    {option.count} {option.count === 1 ? 'day' : 'days'}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: habit.color,
                      borderRadius: 3,
                      width: `${stats.eligible ? (option.count / stats.eligible) * 100 : 0}%`,
                    }}
                  />
                </View>
              </View>
            ))}
          <InfoNote
            label="About category counts"
            text="Each category counts days it was selected. Several categories can be recorded on the same day, so these counts can add up to more than the number of recorded days. Renamed and archived options keep their records."
          />
        </View>
      )}
      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.heading}>
          {stats.completion.active || stats.completion.eligible > 0
            ? 'Days meeting the goal'
            : 'Days recorded'}
        </Text>
        <Chart
          key={`${habit.id}:${range}:${today}`}
          buckets={
            stats.completion.active || stats.completion.eligible > 0
              ? stats.buckets.map((bucket) => {
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
                })
              : stats.buckets
          }
          colour={habit.color}
          numeric={false}
          unit=""
          recording={
            !stats.completion.active && stats.completion.eligible === 0
          }
        />
      </View>
      <View style={styles.section}>
        <View style={styles.metric}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { flex: 1 }]}
          >
            {new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </Text>
          {([-1, 1] as const).map((delta) => {
            const disabled =
              delta === -1
                ? month <= stats.trackingStart.slice(0, 7)
                : month >= today.slice(0, 7);
            return (
              <Pressable
                key={delta}
                accessibilityRole="button"
                accessibilityLabel={
                  delta === -1 ? 'Previous month' : 'Next month'
                }
                disabled={disabled}
                accessibilityState={{ disabled }}
                onPress={() => changeMonth(delta)}
                style={[styles.monthButton, { opacity: disabled ? 0.3 : 1 }]}
              >
                <Text style={styles.monthArrow}>
                  {delta === -1 ? '‹' : '›'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.calendar}>
          {weekDays.map((day) => (
            <Text key={day} style={styles.calendarHeading}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day]}
            </Text>
          ))}
          {Array.from({ length: calendar.padding }, (_, index) => (
            <View key={`blank:${index}`} style={styles.day} />
          ))}
          {calendar.days.map((date) => {
            const value = values[`${habit.id}:${date}`],
              day = entryDay(date),
              recorded = value !== undefined;
            const goal = evaluateGoal(habit, value, date);
            return (
              <Pressable
                key={date}
                testID={`record-day-${habit.id}-${date}`}
                accessibilityRole="button"
                accessibilityLabel={`${habit.name}, ${day.fullLabel}, ${recorded ? entryLabel(habit, value) : 'not recorded'}, ${goal.active ? (goal.met ? 'goal met' : 'goal not met') : 'tracking only'}${goal.active && !goal.scheduled ? ', not scheduled' : ''}`}
                accessibilityHint="Read or edit this day's entry"
                accessibilityState={{ disabled: !editable }}
                disabled={!editable}
                onPress={() => onCellPress(habit, day)}
                style={[styles.day, { minHeight: 64 * Math.max(1, fontScale) }]}
              >
                <View
                  style={[
                    styles.face,
                    {
                      backgroundColor: recorded
                        ? colorOnBlack(habit.color, goal.met ? 0.3 : 0.13)
                        : '#151515',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.date,
                      { color: date > today ? '#666666' : '#A0A0A0' },
                    ]}
                  >
                    {Number(date.slice(-2))}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[
                      styles.dayValue,
                      { color: recorded ? habit.color : '#555555' },
                    ]}
                  >
                    {cellEntryLabel(habit, value)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text accessibilityRole="header" style={styles.heading}>
        Entries · selected period
      </Text>
    </View>
  );
  return (
    <FlatList<DailyRecord>
      testID="habit-statistics"
      data={stats.records}
      keyExtractor={(item) => item.date}
      directionalLockEnabled
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="never"
      initialNumToRender={10}
      maxToRenderPerBatch={6}
      windowSize={7}
      contentContainerStyle={[styles.body, { paddingBottom: bottomInset }]}
      ListHeaderComponent={header}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${dateLabel(item.date)}, ${entryLabel(habit, item.value)}`}
          accessibilityHint="Edit this day's entry"
          accessibilityState={{ disabled: !editable }}
          disabled={!editable}
          onPress={() => onCellPress(habit, entryDay(item.date))}
          style={styles.entry}
        >
          <Text style={styles.entryDate}>{dateLabel(item.date)}</Text>
          <Text numberOfLines={3} style={styles.entryValue}>
            {entryLabel(habit, item.value)}
          </Text>
        </Pressable>
      )}
      ListEmptyComponent={
        <Text style={styles.caption}>Nothing recorded in this period.</Text>
      }
      ListFooterComponent={
        <InfoNote
          label="How recording statistics work"
          text="Recording counts use all calendar days since the start. Success counts use scheduled days and the goal effective on each date. Off-days leave success streaks intact; logging streaks require consecutive calendar entries. An unfinished today has a streak grace period. Future and pre-start entries are kept, but excluded from statistics."
        />
      }
    />
  );
});
const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  header: { gap: 20, paddingBottom: 12 },
  caption: { color: '#989898', fontSize: 13, lineHeight: 19 },
  section: { gap: 12 },
  summary: { color: '#DDDDDD', fontSize: 18, fontWeight: '500' },
  heading: { color: '#D0D0D0', fontSize: 15, fontWeight: '600' },
  ranges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    backgroundColor: '#171717',
    borderRadius: 13,
    padding: 4,
  },
  range: {
    flexGrow: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  rangeText: { color: '#BBBBBB', fontSize: 14, fontWeight: '600' },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricValue: {
    color: '#DDDDDD',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  track: { height: 4, borderRadius: 3, backgroundColor: '#202020' },
  monthButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrow: { color: '#BBBBBB', fontSize: 27 },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarHeading: {
    width: '14.285714%',
    textAlign: 'center',
    color: '#888888',
    fontSize: 11,
    paddingVertical: 8,
  },
  day: { width: '14.285714%', minHeight: 64, padding: 3 },
  face: {
    flex: 1,
    borderRadius: 9,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  date: { fontSize: 11 },
  dayValue: { fontSize: 12, textAlign: 'center', width: '100%' },
  entry: {
    minHeight: 54,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
    gap: 4,
  },
  entryDate: { color: '#888888', fontSize: 11 },
  entryValue: { color: '#D0D0D0', fontSize: 15, lineHeight: 22 },
});
