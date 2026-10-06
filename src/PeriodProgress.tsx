import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Typography';
import { Icon } from './Icon';
import { periodSummary, periodMet } from './goalTiming';
import type { periodStatistics, PeriodResult } from './periodStatistics';

export function PeriodProgress({
  data,
  colour,
}: {
  data: ReturnType<typeof periodStatistics>;
  colour: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!data.current && !data.recent.length) return null;
  const label = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const status = (row: PeriodResult) =>
    row.status === 'rest'
      ? 'Rest period'
      : row.status === 'partial'
        ? 'Partial period · not scored'
        : row.status === 'met'
          ? 'Goal met'
          : row.status === 'missed'
            ? 'Goal not met'
            : periodMet(row.period, row.count)
              ? row.period.operator === 'atLeast'
                ? 'Target reached'
                : 'Within limit so far'
              : row.period.operator !== 'atLeast' &&
                  row.count > (row.period.upper ?? row.period.target)
                ? 'Over limit'
                : 'In progress';
  return (
    <View style={styles.section}>
      {data.current && (
        <View style={{ gap: 5 }}>
          <Text style={styles.heading}>
            {data.current.count} {data.current.count === 1 ? 'day' : 'days'} so
            far
          </Text>
          <Text style={styles.text}>{periodSummary(data.current.period)}</Text>
          <Text style={styles.note}>
            {label(data.current.start)} – {label(data.current.end)}
          </Text>
          <Text style={[styles.text, { color: colour }]}>
            {status(data.current)}
          </Text>
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Period results"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.toggle}
      >
        <Text style={[styles.text, { flex: 1 }]}>
          {data.eligible
            ? `Goal met in ${data.met} of ${data.eligible} finished periods`
            : 'No finished periods yet'}
        </Text>
        <Icon name="chevron" color="#999999" size={16} />
      </Pressable>
      {expanded && (
        <View style={{ gap: 14 }}>
          <Text style={styles.note}>
            Period streak {data.streak} · longest {data.bestStreak} (all time)
          </Text>
          {data.recent.map((row) => (
            <View key={row.id} style={{ gap: 3 }}>
              <Text style={styles.text}>
                {label(row.start)} – {label(row.end)}
              </Text>
              <Text style={styles.note}>
                {row.count} days · {status(row)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 8, paddingVertical: 12 },
  heading: { fontSize: 20, color: '#EEEEEE', fontWeight: '600' },
  text: { fontSize: 14, color: '#CCCCCC' },
  note: { fontSize: 12, color: '#999999' },
  toggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
