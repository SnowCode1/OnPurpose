import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Text } from './Typography';
import { Icon } from './Icon';
import type { StatsBucket } from './statistics';
import { formatStatistic, statisticDateLabel } from './statisticsFormatting';

export function StatsChart({
  buckets,
  colour,
  numeric,
  unit,
  recording = false,
  targets,
  legend,
}: {
  /** What the bars measure, shown while no bar is selected. */
  legend?: string;
  recording?: boolean;
  targets?: number[][];
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
    ? Math.max(
        1,
        ...buckets.map((bucket) => bucket.value ?? 0),
        ...(targets?.flat() ?? []),
      )
    : 100;
  const step = width / Math.max(1, buckets.length);
  const showYear =
    buckets[0]?.start.slice(0, 4) !== buckets.at(-1)?.end.slice(0, 4);
  const period = current
    ? `${statisticDateLabel(current.start, showYear)}${current.end !== current.start ? ` – ${statisticDateLabel(current.end, showYear)}` : ''}`
    : '';
  const value = current
    ? current.value === null
      ? 'No records'
      : `${formatStatistic(current.value)}${numeric ? (unit ? ` ${unit}` : '') : recording ? '% recorded' : '% completed'}`
    : '';
  const fallbackLegend = numeric
    ? `${unit || 'Total'} per bar`
    : recording
      ? 'Days recorded (%)'
      : 'Days completed (%)';
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.chartPlot}>
        <View style={styles.chartScale} accessible={false}>
          <Text style={styles.small}>{formatStatistic(max)}</Text>
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
              {numeric &&
                targets?.flatMap((levels, index) =>
                  levels.map((target, level) => (
                    <Line
                      key={`target-${index}-${level}`}
                      x1={index * step + step * 0.08}
                      x2={(index + 1) * step - step * 0.08}
                      y1={150 - (target / max) * 148}
                      y2={150 - (target / max) * 148}
                      stroke={colour}
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      opacity={0.6}
                    />
                  )),
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
                {statisticDateLabel(buckets[0].start, showYear)}
              </Text>
              <Text style={[styles.small, { flex: 1, textAlign: 'right' }]}>
                {statisticDateLabel(buckets.at(-1)!.end, showYear)}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.chartDetail}>
        <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {current ? (
            <Text numberOfLines={2} style={styles.caption}>
              {period} · <Text style={{ color: colour }}>{value}</Text>
            </Text>
          ) : (
            <Text numberOfLines={2} style={styles.small}>
              {legend ?? fallbackLegend}
            </Text>
          )}
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
          <Icon name="close" size={16} color="#9A9A9A" />
        </Pressable>
      </View>
    </View>
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
    minHeight: 44,
  },
  clearSelection: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
