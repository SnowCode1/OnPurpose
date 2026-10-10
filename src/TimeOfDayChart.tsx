import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Text } from './Typography';
import { Icon } from './Icon';
import { StatsSection } from './StatsLayout';
import type { TimeOfDayStatistics } from './timeOfDay';

const HEIGHT = 110;
const hourLabel = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' });
const hourRange = (hour: number) =>
  `${hourLabel(hour)}–${hourLabel((hour + 1) % 24)}`;
const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

// Shared by both statistics screens, including its section heading.
export function TimeOfDayChart({
  stats,
  colour,
}: {
  stats: TimeOfDayStatistics;
  colour: string;
}) {
  const [width, setWidth] = useState(300);
  const [selected, setSelected] = useState<number | null>(null);
  const step = width / 24;
  const max = Math.max(1, ...stats.hours);
  const left = stats.recorded - stats.counted;
  return (
    <StatsSection
      title="Time of day"
      subtitle={
        stats.peak !== null
          ? `Most often ${hourRange(stats.peak)}`
          : stats.recorded
            ? 'No same-day entries in this period'
            : 'Nothing recorded in this period'
      }
      info={`Each bar counts days by the hour their entry was first made, in the local time where it was made. Only entries made on the day they belong to count: this period has ${stats.counted} of ${days(stats.recorded)}${left ? `; ${left} added on a later day ${left === 1 ? 'is' : 'are'} left out` : ''}. Corrections keep the original time and undone changes never count. Tap a bar to see its hour.`}
    >
      {stats.counted > 0 && (
        <View style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="Time of day chart"
            accessibilityValue={{
              text:
                selected === null
                  ? 'No hour selected'
                  : `${hourRange(selected)}: ${days(stats.hours[selected])}`,
            }}
            accessibilityHint="Adjust to inspect hours. Use Clear selection to show all bars."
            accessibilityActions={[
              { name: 'increment', label: 'Next hour' },
              { name: 'decrement', label: 'Previous hour' },
              { name: 'clearSelection', label: 'Clear selection' },
            ]}
            onAccessibilityAction={(event) => {
              const action = event.nativeEvent.actionName;
              if (action === 'clearSelection') setSelected(null);
              else if (action === 'increment' || action === 'decrement')
                setSelected((previous) =>
                  previous === null
                    ? action === 'increment'
                      ? 0
                      : 23
                    : Math.max(
                        0,
                        Math.min(
                          23,
                          previous + (action === 'increment' ? 1 : -1),
                        ),
                      ),
                );
            }}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            onPress={(event) => {
              if (width <= 0) return;
              const hour = Math.max(
                0,
                Math.min(23, Math.floor(event.nativeEvent.locationX / step)),
              );
              setSelected((previous) => (previous === hour ? null : hour));
            }}
            style={{ height: HEIGHT }}
          >
            <Svg
              width={width}
              height={HEIGHT}
              pointerEvents="none"
              accessible={false}
            >
              {[2, HEIGHT - 4].map((y) => (
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
              {selected !== null && (
                <Rect
                  x={selected * step}
                  y={0}
                  width={step}
                  height={HEIGHT - 2}
                  rx={3}
                  fill={colour}
                  opacity={0.08}
                />
              )}
              {stats.hours.map(
                (count, hour) =>
                  count > 0 && (
                    <Rect
                      key={hour}
                      x={hour * step + step * 0.16}
                      y={HEIGHT - 4 - Math.max(2, (count / max) * (HEIGHT - 6))}
                      width={Math.max(1, step * 0.68)}
                      height={Math.max(2, (count / max) * (HEIGHT - 6))}
                      rx={Math.min(3, step * 0.2)}
                      fill={colour}
                      opacity={
                        selected === null || selected === hour ? 0.9 : 0.35
                      }
                    />
                  ),
              )}
            </Svg>
          </Pressable>
          <View style={styles.axis} accessible={false}>
            {[0, 6, 12, 18].map((hour) => (
              <Text key={hour} style={[styles.small, { flex: 1 }]}>
                {hourLabel(hour)}
              </Text>
            ))}
          </View>
          <View style={styles.detail}>
            <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
              {selected === null ? (
                <Text style={styles.small}>Days per hour</Text>
              ) : (
                <Text style={styles.caption}>
                  {hourRange(selected)} ·{' '}
                  <Text style={{ color: colour }}>
                    {days(stats.hours[selected])}
                  </Text>
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear time of day selection"
              accessibilityElementsHidden={selected === null}
              importantForAccessibility={
                selected === null ? 'no-hide-descendants' : 'auto'
              }
              disabled={selected === null}
              onPress={() => setSelected(null)}
              style={({ pressed }) => [
                styles.clear,
                { opacity: selected === null ? 0 : pressed ? 0.5 : 1 },
              ]}
            >
              <Icon name="close" size={16} color="#9A9A9A" />
            </Pressable>
          </View>
        </View>
      )}
    </StatsSection>
  );
}

const styles = StyleSheet.create({
  caption: { color: '#989898', fontSize: 13, lineHeight: 19 },
  small: {
    color: '#858585',
    fontSize: 12,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  axis: { flexDirection: 'row' },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  clear: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
