import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, useAppWindowDimensions } from './Typography';
import { Icon } from './Icon';
import { entryDay } from './calendar';
import { monthDays } from './statistics';
import { weekDayOrder, type WeekStart } from './displayPreferences';

const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function shiftMonth(month: string, by: number) {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + by);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
const monthLabel = (month: string, style: 'long' | 'short') =>
  new Date(`${month}-01T12:00:00`).toLocaleDateString(undefined, {
    month: style,
    ...(style === 'long' ? { year: 'numeric' } : {}),
  });

// Android has no inline system date picker, so this dark month calendar sits
// inside our own sheets and editors. iOS keeps its native inline/compact picker.
// Tapping the month title switches to a month/year chooser for distant dates.
export function DateCalendar({
  value,
  today,
  onChange,
  accent = '#DDDDDD',
  weekStart = 'monday',
}: {
  value: string;
  today: string;
  onChange: (date: string) => void;
  accent?: string;
  weekStart?: WeekStart;
}) {
  const { fontScale } = useAppWindowDimensions();
  const [month, setMonth] = useState(value.slice(0, 7));
  const [choosing, setChoosing] = useState(false);
  const year = Number(month.slice(0, 4));
  const calendar = monthDays(month, weekStart);
  const cellHeight = Math.max(44, Math.ceil(42 * fontScale));
  const step = (by: number) => setMonth((current) => shiftMonth(current, by));
  return (
    <View>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            choosing
              ? `Year ${year}, choose a month`
              : `${monthLabel(month, 'long')}, choose month and year`
          }
          accessibilityState={{ expanded: choosing }}
          onPress={() => setChoosing((open) => !open)}
          style={styles.title}
        >
          <Text style={styles.titleText}>
            {choosing ? String(year) : monthLabel(month, 'long')}
          </Text>
          <View style={choosing && styles.chevronOpen}>
            <Icon
              name="chevron"
              size={Math.round(15 * Math.max(1, fontScale))}
              strokeWidth={2.2}
              color="#9C9C9C"
            />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={choosing ? 'Previous year' : 'Previous month'}
          onPress={() => step(choosing ? -12 : -1)}
          style={styles.nav}
        >
          <View style={{ transform: [{ rotate: '90deg' }] }}>
            <Icon name="chevron" size={20} color="#D0D0D0" />
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={choosing ? 'Next year' : 'Next month'}
          onPress={() => step(choosing ? 12 : 1)}
          style={styles.nav}
        >
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Icon name="chevron" size={20} color="#D0D0D0" />
          </View>
        </Pressable>
      </View>
      {choosing ? (
        <View style={styles.months}>
          {Array.from({ length: 12 }, (_, index) => {
            const key = `${year}-${String(index + 1).padStart(2, '0')}`;
            const selected = key === month;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={monthLabel(key, 'long')}
                accessibilityState={{ selected }}
                onPress={() => {
                  setMonth(key);
                  setChoosing(false);
                }}
                style={({ pressed }) => [
                  styles.month,
                  { minHeight: cellHeight, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.face,
                    selected && { backgroundColor: '#262626' },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: selected ? '#FFFFFF' : '#B8B8B8',
                      fontSize: 15,
                    }}
                  >
                    {monthLabel(key, 'short')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.grid}>
          {weekDayOrder(weekStart).map((day) => (
            <Text
              key={day}
              numberOfLines={1}
              importantForAccessibility="no"
              accessibilityElementsHidden
              style={styles.weekday}
            >
              {weekdayLabels[day]}
            </Text>
          ))}
          {Array.from({ length: calendar.padding }, (_, index) => (
            <View
              key={`blank-${index}`}
              style={[styles.day, { height: cellHeight }]}
            />
          ))}
          {calendar.days.map((day) => {
            const selected = day === value;
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`${entryDay(day).fullLabel}${day === today ? ', today' : ''}`}
                accessibilityState={{ selected }}
                onPress={() => onChange(day)}
                style={({ pressed }) => [
                  styles.day,
                  { minHeight: cellHeight, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <View
                  style={[
                    styles.face,
                    selected && { backgroundColor: accent },
                    !selected && day === today && styles.today,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: selected
                        ? '#000000'
                        : day > today
                          ? '#707070'
                          : '#C8C8C8',
                      fontSize: 15,
                      fontWeight: selected || day === today ? '600' : '400',
                    }}
                  >
                    {Number(day.slice(8))}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {/* Always six weeks, so the card keeps one height between months. */}
          {Array.from(
            { length: 42 - calendar.padding - calendar.days.length },
            (_, index) => (
              <View
                key={`end-${index}`}
                style={[styles.day, { height: cellHeight }]}
              />
            ),
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  title: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  titleText: { color: '#EEEEEE', fontSize: 17, fontWeight: '700' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  nav: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.2857%',
    textAlign: 'center',
    color: '#777777',
    fontSize: 11,
    paddingBottom: 8,
  },
  day: { width: '14.2857%', padding: 2 },
  months: { flexDirection: 'row', flexWrap: 'wrap' },
  month: { width: '33.3333%', padding: 3 },
  face: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  today: { borderWidth: 1, borderColor: '#555555' },
});
