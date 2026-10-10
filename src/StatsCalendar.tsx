import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text, useAppWindowDimensions } from './Typography';
import { Icon } from './Icon';
import { entryDay, type EntryDay } from './calendar';
import { checkmarkColor, colorOnBlack, contrastOnBlack } from './colors';
import { weekDayOrder, type WeekStart } from './displayPreferences';
import { cellEntryLabel, entryLabel } from './entries';
import { habitType, type Habit } from './habits';
import { MISSED_OPACITY } from './outcomeColours';
import { dateKey, dayNumber } from './statistics';
import {
  formatStatistic as format,
  statisticDateLabel,
  statisticDayLabel,
} from './statisticsFormatting';
import {
  isRecorded,
  weekStartOf,
  type Outcome,
  type SeriesDay,
} from './statsSeries';

type CellState = Outcome | 'beyond';
type Cell = {
  day: number;
  date: string;
  item: SeriesDay | null;
  state: CellState;
};
const OUTCOME_TEXT: Partial<Record<CellState, string>> = {
  met: 'goal met',
  missed: 'goal missed',
  open: 'goal not met yet',
  off: 'not scheduled',
  outside: 'before the start date',
  future: 'future date',
};

/** The fill for one calendar day; categorical/text stay dimmer for dots. */
function dayFill(
  habit: Habit,
  cell: Cell,
  colour: string,
  numericMax: number,
): string {
  const recorded = isRecorded(habit, cell.item?.value),
    plain = habitType(habit) === 'categorical' || habitType(habit) === 'text';
  switch (cell.state) {
    case 'met':
      return plain ? colorOnBlack(colour, 0.42) : colour;
    // A missed day keeps a faint tint ("expected, not done"); a day off
    // stays black, and today stays neutral until it is done.
    case 'missed':
      return colorOnBlack(colour, recorded ? MISSED_OPACITY * 0.7 : 0.13);
    case 'open':
      return recorded ? colorOnBlack(colour, MISSED_OPACITY * 0.7) : '#1A1A1A';
    case 'off':
      return recorded ? '#2A2A2A' : '#0B0B0B';
    case 'track': {
      if (!recorded) return '#171717';
      const value = cell.item?.value;
      return colorOnBlack(
        colour,
        typeof value === 'number'
          ? 0.3 + 0.45 * Math.min(1, value / Math.max(1, numericMax))
          : 0.3,
      );
    }
    case 'future':
      return '#0C0C0C';
    default:
      return 'transparent';
  }
}

function describe(habit: Habit, cell: Cell, unit: string) {
  const value = cell.item?.value;
  const recorded =
    habitType(habit) === 'checkbox'
      ? value === 1
        ? 'checked'
        : value === 0
          ? 'unchecked'
          : ''
      : value === undefined
        ? 'no entry'
        : typeof value === 'number'
          ? `${format(value)}${unit ? ` ${unit}` : ''}`
          : entryLabel(habit, value);
  return [recorded, OUTCOME_TEXT[cell.state] ?? ''].filter(Boolean).join(' · ');
}

/**
 * The calendar for the selected window: rows of weeks for up to about three
 * months (successful days join into one bar; off days inside a streak bridge
 * it), and compact months for longer ranges.
 */
export function StatsCalendar(props: {
  habit: Habit;
  days: SeriesDay[];
  from: number;
  to: number;
  today: string;
  weekStart: WeekStart;
  editable: boolean;
  allowFuture: boolean;
  onDayPress: (habit: Habit, day: EntryDay) => void;
  categoryColours?: Map<string, string>;
  highlight?: string | null;
}) {
  return props.to - props.from + 1 <= 100 ? (
    <WeekRows {...props} />
  ) : (
    <MonthGrid {...props} />
  );
}

function cellsFor(
  days: SeriesDay[],
  from: number,
  to: number,
  today: string,
  start: number,
  end: number,
) {
  const now = dayNumber(today),
    cells: Cell[] = [];
  for (let day = start; day <= end; day++) {
    const item = day >= from && day <= to ? days[day - from] : null;
    cells.push({
      day,
      date: dateKey(day),
      item,
      state: item ? item.outcome : day > now ? 'future' : 'beyond',
    });
  }
  return cells;
}

function WeekRows({
  habit,
  days,
  from,
  to,
  today,
  weekStart,
  editable,
  allowFuture,
  onDayPress,
  categoryColours,
  highlight,
}: Parameters<typeof StatsCalendar>[0]) {
  const { fontScale } = useAppWindowDimensions();
  const colour = habit.color,
    unit = habit.unit ?? '',
    type = habitType(habit),
    start = weekStartOf(from, weekStart),
    end = weekStartOf(to, weekStart) + 6,
    cells = cellsFor(days, from, to, today, start, end),
    numericMax = Math.max(
      1,
      ...days.map((item) => (typeof item.value === 'number' ? item.value : 0)),
    ),
    rowHeight = Math.ceil((to - from < 45 ? 52 : 42) * Math.max(1, fontScale));
  const rows: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return (
    <View>
      <View style={styles.headings}>
        {weekDayOrder(weekStart).map((day) => (
          <Text key={day} numberOfLines={1} style={styles.heading}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day]}
          </Text>
        ))}
      </View>
      {rows.map((row) => {
        // Off days between successes keep a streak alive: bridge them.
        const bridged = row.map((cell, i) => {
          if (cell.state !== 'off') return false;
          let left = i - 1,
            right = i + 1;
          while (left >= 0 && row[left].state === 'off') left--;
          while (right < row.length && row[right].state === 'off') right++;
          return row[left]?.state === 'met' && row[right]?.state === 'met';
        });
        const joined = (i: number) =>
          i >= 0 && i < row.length && (row[i].state === 'met' || bridged[i]);
        return (
          <View key={row[0].day} style={styles.row}>
            {row.map((cell, i) => {
              const inRun = cell.state === 'met' || bridged[i],
                left = inRun && joined(i - 1),
                right = inRun && joined(i + 1),
                fill = bridged[i]
                  ? colorOnBlack(colour, 0.38)
                  : dayFill(habit, cell, colour, numericMax),
                strong =
                  fill.startsWith('#') &&
                  fill.length === 7 &&
                  contrastOnBlack(fill) > 7,
                text = strong
                  ? checkmarkColor(fill)
                  : cell.state === 'beyond'
                    ? '#3C3C3C'
                    : cell.state === 'future' || cell.state === 'outside'
                      ? '#5C5C5C'
                      : '#A8A8A8',
                firstLabel =
                  cell.date.endsWith('-01') ||
                  (cell.day === from && cell.item !== null),
                tappable =
                  editable &&
                  (cell.item !== null ||
                    (cell.state === 'future' && allowFuture)),
                value = cell.item?.value;
              return (
                <Pressable
                  key={cell.day}
                  disabled={!tappable}
                  accessibilityRole={
                    type === 'checkbox' ? 'checkbox' : 'button'
                  }
                  accessibilityState={{
                    disabled: !tappable,
                    ...(type === 'checkbox' ? { checked: value === 1 } : {}),
                  }}
                  accessibilityLabel={`${habit.name}, ${entryDay(cell.date).fullLabel}${cell.date === today ? ', today' : ''}, ${describe(habit, cell, unit)}`}
                  accessibilityHint={
                    tappable
                      ? type === 'checkbox'
                        ? 'Toggle checkbox'
                        : 'Edit this day'
                      : undefined
                  }
                  importantForAccessibility={
                    cell.state === 'beyond' ? 'no-hide-descendants' : 'auto'
                  }
                  onPress={() => onDayPress(habit, entryDay(cell.date))}
                  style={({ pressed }) => [
                    styles.cell,
                    { height: rowHeight, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.face,
                      {
                        backgroundColor: fill,
                        marginLeft: left ? -2 : 0,
                        marginRight: right ? -2 : 0,
                        borderTopLeftRadius: left ? 0 : 9,
                        borderBottomLeftRadius: left ? 0 : 9,
                        borderTopRightRadius: right ? 0 : 9,
                        borderBottomRightRadius: right ? 0 : 9,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.date,
                        { color: text },
                        cell.date === today && styles.today,
                      ]}
                    >
                      {firstLabel
                        ? statisticDateLabel(cell.date)
                        : Number(cell.date.slice(-2))}
                    </Text>
                    {type === 'number' && typeof value === 'number' && (
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.value,
                          { color: strong ? text : colour },
                        ]}
                      >
                        {cellEntryLabel(habit, value)}
                      </Text>
                    )}
                    {type === 'categorical' && Array.isArray(value) && (
                      <View style={styles.dots}>
                        {value.slice(0, 4).map((id) => (
                          <View
                            key={id}
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  categoryColours?.get(id) ?? colour,
                                opacity:
                                  !highlight || highlight === id ? 1 : 0.2,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}
                    {type === 'text' && typeof value === 'string' && (
                      <View style={[styles.dot, { backgroundColor: colour }]} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function MonthGrid({
  habit,
  days,
  from,
  to,
  today,
  weekStart,
  editable,
  onDayPress,
  categoryColours,
  highlight,
}: Parameters<typeof StatsCalendar>[0]) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const colour = habit.color,
    unit = habit.unit ?? '';
  const numericMax = Math.max(
    1,
    ...days.map((item) => (typeof item.value === 'number' ? item.value : 0)),
  );
  const months: string[] = [];
  for (
    let month = dateKey(from).slice(0, 7);
    month <= dateKey(to).slice(0, 7);
    month = nextMonth(month)
  )
    months.push(month);
  const columns = months.length > 12 ? 4 : 3,
    gapX = 14,
    blockWidth = width ? (width - gapX * (columns - 1)) / columns : 0,
    gap = 1.5,
    size = blockWidth ? (blockWidth - gap * 6) / 7 : 0,
    order = weekDayOrder(weekStart);
  const selectedCell =
    selected === null
      ? null
      : cellsFor(days, from, to, today, selected, selected)[0];
  const highlightFill = (cell: Cell) => {
    const value = cell.item?.value;
    if (
      highlight &&
      Array.isArray(value) &&
      cell.state !== 'beyond' &&
      cell.state !== 'future'
    )
      return value.includes(highlight)
        ? (categoryColours?.get(highlight) ?? colour)
        : '#171717';
    return dayFill(habit, cell, colour, numericMax);
  };
  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={{ gap: 12 }}
    >
      <View style={styles.months}>
        {width > 0 &&
          months.map((month) => {
            const first = dayNumber(`${month}-01`),
              last = dayNumber(`${nextMonth(month)}-01`) - 1,
              lead = order.indexOf(new Date(first * 86400000).getUTCDay()),
              weeks = Math.ceil((lead + last - first + 1) / 7),
              cells = cellsFor(days, from, to, today, first, last);
            return (
              <View key={month} style={{ width: blockWidth, gap: 5 }}>
                <Text style={styles.monthLabel}>
                  {new Date(`${month}-15T12:00:00`).toLocaleDateString(
                    undefined,
                    {
                      month: 'short',
                      ...(month.endsWith('-01') || month === months[0]
                        ? { year: 'numeric' }
                        : {}),
                    },
                  )}
                </Text>
                <Pressable
                  accessibilityRole="adjustable"
                  accessibilityLabel={new Date(
                    `${month}-15T12:00:00`,
                  ).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                  accessibilityHint="Adjust to move between days"
                  accessibilityActions={[
                    { name: 'increment', label: 'Next day' },
                    { name: 'decrement', label: 'Previous day' },
                  ]}
                  onAccessibilityAction={(event) => {
                    const step =
                      event.nativeEvent.actionName === 'increment' ? 1 : -1;
                    setSelected((previous) =>
                      Math.max(
                        Math.max(from, first),
                        Math.min(
                          Math.min(to, last),
                          previous === null ||
                            previous < first ||
                            previous > last
                            ? step > 0
                              ? first
                              : last
                            : previous + step,
                        ),
                      ),
                    );
                  }}
                  onPress={(event) => {
                    const column = Math.floor(
                      event.nativeEvent.locationX / (size + gap),
                    );
                    const row = Math.floor(
                      event.nativeEvent.locationY / (size + gap),
                    );
                    const day = first + row * 7 + column - lead;
                    if (day < first || day > last) return;
                    setSelected((previous) => (previous === day ? null : day));
                  }}
                >
                  <Svg
                    width={blockWidth}
                    height={weeks * (size + gap) - gap}
                    pointerEvents="none"
                    accessible={false}
                  >
                    {cells.map((cell, index) => {
                      const position = index + lead,
                        x = (position % 7) * (size + gap),
                        y = Math.floor(position / 7) * (size + gap),
                        fill = highlightFill(cell);
                      return (
                        <Rect
                          key={cell.day}
                          x={x}
                          y={y}
                          width={size}
                          height={size}
                          rx={Math.min(3, size * 0.25)}
                          fill={fill === 'transparent' ? '#0B0B0B' : fill}
                          stroke={cell.day === selected ? '#FFFFFF' : undefined}
                          strokeWidth={cell.day === selected ? 1.5 : 0}
                        />
                      );
                    })}
                  </Svg>
                </Pressable>
              </View>
            );
          })}
      </View>
      <View style={styles.readout}>
        <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {selectedCell ? (
            <Text numberOfLines={2} style={styles.caption}>
              {statisticDayLabel(selectedCell.date, today)} ·{' '}
              <Text style={{ color: colour }}>
                {describe(habit, selectedCell, unit)}
              </Text>
            </Text>
          ) : (
            <Text style={styles.small}>Tap a day to see it</Text>
          )}
        </View>
        {selectedCell && (
          <>
            {editable && selectedCell.item && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit this day"
                onPress={() => onDayPress(habit, entryDay(selectedCell.date))}
                style={({ pressed }) => [
                  styles.control,
                  { opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <Icon name="edit" size={17} color="#C8C8C8" />
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear selection"
              onPress={() => setSelected(null)}
              style={({ pressed }) => [
                styles.control,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Icon name="close" size={16} color="#9A9A9A" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function nextMonth(month: string) {
  const [year, number] = month.split('-').map(Number);
  return number === 12
    ? `${year + 1}-01`
    : `${year}-${String(number + 1).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  headings: { flexDirection: 'row', paddingBottom: 6 },
  heading: {
    flex: 1,
    textAlign: 'center',
    color: '#777777',
    fontSize: 11,
  },
  row: { flexDirection: 'row' },
  cell: { flex: 1, paddingHorizontal: 2, paddingVertical: 2 },
  face: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  date: { fontSize: 12, fontVariant: ['tabular-nums'] },
  today: { fontWeight: '700' },
  value: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  months: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 14 },
  monthLabel: { color: '#9A9A9A', fontSize: 12, fontWeight: '600' },
  readout: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  caption: { color: '#A0A0A0', fontSize: 13, lineHeight: 19 },
  small: { color: '#858585', fontSize: 12, lineHeight: 18 },
  control: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
