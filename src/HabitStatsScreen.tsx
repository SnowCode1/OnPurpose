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
  MonthArrows,
  RangePicker,
  StatTiles,
  StatsSection,
  statsStyles,
  streakTiles,
  type StatTile,
} from './StatsLayout';
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
  const showYear = stats.start.slice(0, 4) !== today.slice(0, 4);
  const goalShown = stats.completion.active || stats.completion.eligible > 0;
  const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;
  const withUnit = (value: number | null) =>
    `${format(value)}${unit ? ` ${unit}` : ''}`;
  const tiles: StatTile[] = [];
  if (stats.numeric) {
    if (goalShown)
      tiles.push({
        label: stats.periodGoals.current
          ? 'Days meeting the daily condition'
          : 'Days meeting the goal',
        value: stats.completion.eligible
          ? `${stats.completion.successes} of ${stats.completion.eligible}`
          : '—',
      });
    tiles.push(
      { label: 'Average per day', value: withUnit(stats.average) },
      {
        label: 'Best day',
        value: withUnit(stats.recorded ? stats.best : null),
      },
    );
  }
  if (!stats.periodGoals.current)
    tiles.push(
      ...streakTiles(
        tiles.length,
        stats.numeric && !stats.completion.active
          ? 'Days recorded in a row'
          : 'Current streak',
        stats.streak,
        stats.bestStreak,
      ),
    );
  const numericGoalMarks =
    stats.numeric &&
    stats.bucketDays === 1 &&
    !!habit.goals?.some((goal) => goal.rule.kind === 'number');
  return (
    <ScrollView
      {...sheetScroll}
      testID="habit-statistics"
      alwaysBounceVertical
      directionalLockEnabled
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[statsStyles.body, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      <RangePicker range={range} onChange={setRange} />
      <View style={statsStyles.overview}>
        <Text style={statsStyles.period}>
          {stats.eligible
            ? `${dateLabel(stats.start, showYear)} – ${dateLabel(today, showYear)}`
            : `Starts ${dateLabel(stats.trackingStart, true)}`}
        </Text>
        <Text style={statsStyles.headline}>
          {stats.numeric
            ? stats.recorded
              ? withUnit(stats.total)
              : 'Nothing recorded'
            : stats.eligible
              ? `${stats.successes} of ${days(stats.eligible)}`
              : 'No days yet'}
        </Text>
        <Text style={statsStyles.headlineNote}>
          {stats.numeric
            ? stats.recorded
              ? `Recorded on ${stats.recorded} of ${days(stats.eligible)}`
              : 'Your records will appear here.'
            : stats.rate === null
              ? 'Your records will appear here.'
              : `${Math.round(stats.rate * 100)}% successful`}
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
      {stats.numeric && goalShown && (
        <StatsSection
          title="Days meeting the condition"
          info="Each bar shows the share of scheduled days in that period whose total met the goal effective on that day. Days without an entry never meet it. Tap a bar to see its value."
        >
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
            legend="Days meeting the goal (%)"
          />
        </StatsSection>
      )}
      <StatsSection
        title={stats.numeric ? 'Daily totals' : 'Successful days'}
        subtitle={
          !stats.recorded && !stats.successes
            ? 'Nothing recorded in this period'
            : null
        }
        info={[
          stats.numeric
            ? stats.bucketDays > 1
              ? `Each bar adds together the totals of up to ${stats.bucketDays} days.`
              : 'Each bar is one day’s total.'
            : `Each bar shows the share of scheduled days that were successful${stats.bucketDays > 1 ? `, up to ${stats.bucketDays} days per bar` : ''}.`,
          numericGoalMarks
            ? 'Dashed marks show the goal for each scheduled day.'
            : '',
          'Tap a bar to see its value.',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <StatsChart
          key={`${habit.id}-${range}-${today}`}
          buckets={stats.buckets}
          colour={habit.color}
          numeric={stats.numeric}
          unit={unit}
          legend={
            stats.numeric
              ? `${unit ? unit[0].toUpperCase() + unit.slice(1) : 'Total'} per ${stats.bucketDays > 1 ? 'bar' : 'day'}`
              : 'Days successful (%)'
          }
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
      </StatsSection>
      <StatsSection
        title="By day of the week"
        info={
          stats.numeric
            ? `Average ${unit || 'total'} per day for each weekday in the selected period. Blank days count as zero.`
            : 'Share of each weekday’s scheduled days that were successful in the selected period.'
        }
      >
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
              style={statsStyles.bar}
            >
              <Text
                style={[
                  statsStyles.small,
                  { width: 34 * Math.max(1, fontScale) },
                ]}
              >
                {label}
              </Text>
              <View style={statsStyles.track}>
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
                style={[
                  statsStyles.small,
                  { minWidth: 52, textAlign: 'right' },
                ]}
              >
                {format(day.value)}
                {day.value !== null && !stats.numeric ? '%' : ''}
              </Text>
            </View>
          );
        })}
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
        info={
          stats.numeric
            ? 'Tap a day to edit its total. Days meeting their goal are brighter; without a goal, brightness follows the total. Zero is still a recorded value.'
            : 'Tap a day to check or uncheck it. Coloured days are completed.'
        }
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
      </StatsSection>
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
});
