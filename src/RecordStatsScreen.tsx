import { PeriodProgress } from './PeriodProgress';
import { summarizeCompletion } from './completionStatistics';
import { memo, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text, useAppWindowDimensions } from './Typography';
import { entryLabel, cellEntryLabel, type EntryValues } from './entries';
import type { Habit } from './habits';
import type { HistoryAction, StoredEvent } from './storage/model';
import { timeOfDayStatistics } from './timeOfDay';
import { TimeOfDayChart } from './TimeOfDayChart';
import { entryDay, type EntryDay } from './calendar';
import { monthDays, type StatsRange } from './statistics';
import { recordStatistics, type DailyRecord } from './recordStatistics';
import { StatsChart } from './StatsChart';
import {
  MonthArrows,
  RangePicker,
  StatTiles,
  StatsSection,
  statsStyles,
  streakTiles,
  type StatTile,
} from './StatsLayout';
import { statisticDateLabel } from './statisticsFormatting';
import { weekDayOrder, type WeekStart } from './displayPreferences';
import { colorOnBlack } from './colors';
import { InfoNote } from './InfoNote';
import { GoalSummary } from './GoalSummary';
import { evaluateGoal } from './habitGoals';
import { useSheetScroll } from './SheetModal';

export const RecordStatsScreen = memo(function RecordStatsScreen({
  habit,
  values,
  events,
  actions,
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
  actions: HistoryAction[];
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
  const goalShown = stats.completion.active || stats.completion.eligible > 0;
  const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;
  const showYear = stats.start.slice(0, 4) !== today.slice(0, 4);
  const tiles: StatTile[] = [];
  if (goalShown)
    tiles.push({
      label: 'Days recorded',
      value: `${stats.recorded} of ${stats.eligible}`,
    });
  if (goalShown && !stats.periodGoals.current)
    tiles.push(
      ...streakTiles(
        tiles.length + 1,
        'Current streak',
        stats.completion.streak,
        stats.completion.bestStreak,
      ),
    );
  tiles.push(
    ...streakTiles(
      tiles.length,
      'Days recorded in a row',
      stats.streak,
      stats.bestStreak,
    ),
  );
  const header = (
    <View style={styles.header}>
      <RangePicker range={range} onChange={setRange} />
      <View style={statsStyles.overview}>
        <Text style={statsStyles.period}>
          {stats.eligible
            ? `${statisticDateLabel(stats.start, showYear)} – ${statisticDateLabel(today, showYear)}`
            : `Starts ${dateLabel(stats.trackingStart)}`}
        </Text>
        <Text style={statsStyles.headline}>
          {goalShown
            ? `${stats.completion.successes} of ${days(stats.completion.eligible)}`
            : `${stats.recorded} of ${days(stats.eligible)}`}
        </Text>
        <Text style={statsStyles.headlineNote}>
          {goalShown
            ? stats.periodGoals.current
              ? 'Meeting the daily condition'
              : 'Meeting the goal'
            : 'Recorded'}
        </Text>
      </View>
      <StatTiles items={tiles} />
      <GoalSummary
        compact
        habit={habit}
        date={today}
        onPress={onGoalEdit}
        disabled={!editable}
      />
      <PeriodProgress data={stats.periodGoals} colour={habit.color} />
      {habit.type === 'categorical' && (
        <StatsSection
          title="Categories"
          info="Each category counts the days it was selected in this period. Several categories can be recorded on the same day, so these counts can add up to more than the number of recorded days. Renamed and archived options keep their records."
        >
          {stats.categories
            .filter((option) => !option.archived || option.count)
            .map((option) => (
              <View
                key={option.id}
                accessible
                accessibilityLabel={`${option.label}${option.archived ? ', archived' : ''}, ${days(option.count)}`}
                style={{ gap: 6 }}
              >
                <View style={styles.metric}>
                  <Text style={[styles.caption, { flex: 1 }]}>
                    {option.label}
                    {option.archived ? ' · archived' : ''}
                  </Text>
                  <Text style={styles.metricValue}>{days(option.count)}</Text>
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
        </StatsSection>
      )}
      <StatsSection
        title={goalShown ? 'Days meeting the goal' : 'Days recorded'}
        info={`Each bar shows the share of ${goalShown ? 'scheduled days meeting the goal effective on that day' : 'days with an entry'}${stats.buckets.length && stats.buckets[0].start !== stats.buckets[0].end ? ', with several days per bar' : ''}. Tap a bar to see its value.`}
      >
        <StatsChart
          key={`${habit.id}:${range}:${today}`}
          buckets={
            goalShown
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
          recording={!goalShown}
          legend={goalShown ? 'Days meeting the goal (%)' : 'Days recorded (%)'}
        />
      </StatsSection>
      <TimeOfDayChart
        key={`${habit.id}-${range}`}
        stats={timeOfDay}
        colour={habit.color}
      />
      <StatsSection
        title={new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        })}
        info="Tap a day to read or edit its entry. Days meeting their goal are brighter."
        accessory={
          <MonthArrows
            previousDisabled={month <= stats.trackingStart.slice(0, 7)}
            nextDisabled={month >= today.slice(0, 7)}
            onChange={changeMonth}
          />
        }
      >
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
      </StatsSection>
      <StatsSection
        title="Entries"
        subtitle={stats.records.length ? 'Selected period, newest first' : null}
      />
    </View>
  );
  const sheetScroll = useSheetScroll();
  return (
    <FlatList<DailyRecord>
      {...sheetScroll}
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
  metric: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricValue: {
    color: '#DDDDDD',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  track: { height: 4, borderRadius: 3, backgroundColor: '#202020' },
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
