import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text, TextInput } from './Typography';
import { StartDateField } from './StartDateField';
import { colorOnBlack } from './colors';
import { allWeekdays } from './habitGoals';
import {
  weekAnchor,
  validTimingDate,
  type GoalTiming,
  type GoalPeriod,
} from './goalTiming';
import type { WeekStart } from './displayPreferences';

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={{ flex: 1, minWidth: 85, gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={Number.isFinite(value) ? String(value) : ''}
        keyboardType="number-pad"
        maxLength={3}
        style={styles.input}
        onChangeText={(next) => {
          onChange(/^\d+$/.test(next) ? Number(next) : NaN);
        }}
      />
    </View>
  );
}
export function GoalTimingFields({
  value,
  onChange,
  from,
  weekStart,
  today,
  colour,
}: {
  value: GoalTiming;
  onChange: (value: GoalTiming) => void;
  from: string;
  weekStart: WeekStart;
  today: string;
  colour: string;
}) {
  const { period, cycle } = value;
  const anchorDate = validTimingDate(from) ? from : today;
  const [customCycle, setCustomCycle] = useState(
    !!cycle &&
      !['5:2:days', '3:1:weeks', '1:1:weeks'].includes(
        `${cycle.on}:${cycle.off}:${cycle.unit}`,
      ),
  );
  const [selectedDays, setSelectedDays] = useState(
    !period && value.weekdays.length < 7,
  );
  function choices(
    label: string,
    options: [string, string][],
    selected: string,
    change: (key: string) => void,
  ) {
    return (
      <View style={{ gap: 7 }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.wrap}>
          {options.map(([key, title]) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={`${label}, ${title}`}
              accessibilityState={{ selected: key === selected }}
              onPress={() => {
                if (key !== selected) change(key);
              }}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    key === selected ? colorOnBlack(colour, 0.18) : '#222222',
                },
              ]}
            >
              <Text
                style={[styles.text, key === selected && { color: colour }]}
              >
                {title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }
  const changePeriod = (patch: Partial<GoalPeriod>) =>
    onChange({ ...value, period: { ...period!, ...patch } });
  return (
    <View style={{ gap: 16 }}>
      {choices(
        'How often',
        [
          ['daily', 'Every day'],
          ['weekdays', 'Selected days'],
          ['period', 'Per period'],
        ],
        period ? 'period' : selectedDays ? 'weekdays' : 'daily',
        (key) => {
          setSelectedDays(key === 'weekdays');
          const { period: _period, ...base } = value;
          onChange({
            ...base,
            weekdays: key === 'weekdays' ? [1, 2, 3, 4, 5] : [...allWeekdays],
            ...(key === 'period'
              ? {
                  period: {
                    unit: 'week',
                    days: 7,
                    anchor: weekAnchor(anchorDate, weekStart),
                    operator: 'atLeast',
                    target: 3,
                  } as GoalPeriod,
                }
              : {}),
          });
        },
      )}
      {!period && selectedDays && (
        <View style={styles.wrap}>
          {[1, 2, 3, 4, 5, 6, 0].map((day) => (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              accessibilityLabel={`Applies on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}`}
              accessibilityState={{ checked: value.weekdays.includes(day) }}
              onPress={() =>
                onChange({
                  ...value,
                  weekdays: value.weekdays.includes(day)
                    ? value.weekdays.filter((item) => item !== day)
                    : [...value.weekdays, day].sort((a, b) => a - b),
                })
              }
              style={[
                styles.day,
                {
                  backgroundColor: value.weekdays.includes(day)
                    ? colorOnBlack(colour, 0.18)
                    : '#222222',
                },
              ]}
            >
              <Text
                style={[
                  styles.text,
                  { color: value.weekdays.includes(day) ? colour : '#999999' },
                ]}
              >
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {!!period && (
        <View style={{ gap: 12 }}>
          {choices(
            'Period',
            [
              ['week', 'Week'],
              ['days', 'Custom days'],
            ],
            period.unit,
            (unit) =>
              changePeriod({
                unit: unit as GoalPeriod['unit'],
                days: unit === 'week' ? 7 : period.days,
                anchor:
                  unit === 'week'
                    ? weekAnchor(anchorDate, weekStart)
                    : anchorDate,
              }),
          )}
          {period.unit === 'days' && (
            <NumberField
              label="Days per period"
              value={period.days}
              onChange={(days) => changePeriod({ days })}
            />
          )}
          {choices(
            'Successful days',
            [
              ['atLeast', 'At least'],
              ['atMost', 'At most'],
              ['between', 'Between'],
            ],
            period.operator,
            (operator) => {
              const { upper: _upper, ...base } = period;
              onChange({
                ...value,
                period: {
                  ...base,
                  operator: operator as GoalPeriod['operator'],
                  ...(operator === 'between'
                    ? {
                        upper: Math.max(
                          period.target,
                          Math.min(period.days, 5),
                        ),
                      }
                    : {}),
                },
              });
            },
          )}
          <View style={styles.wrap}>
            <NumberField
              label={
                period.operator === 'between'
                  ? 'Minimum days'
                  : 'Successful day count'
              }
              value={period.target}
              onChange={(target) => changePeriod({ target })}
            />
            {period.operator === 'between' && (
              <NumberField
                label="Maximum days"
                value={period.upper!}
                onChange={(upper) => changePeriod({ upper })}
              />
            )}
          </View>
        </View>
      )}
      <View style={styles.divider} />
      {choices(
        'On / off cycle',
        [
          ['off', 'None'],
          ['on', 'Repeating'],
        ],
        cycle ? 'on' : 'off',
        (key) => {
          const { cycle: _cycle, ...base } = value;
          onChange({
            ...base,
            ...(key === 'on'
              ? {
                  cycle: {
                    unit: 'days' as const,
                    on: 5,
                    off: 2,
                    anchor: anchorDate,
                  },
                }
              : {}),
          });
        },
      )}
      {!!cycle && (
        <View style={{ gap: 12 }}>
          {choices(
            'Cycle preset',
            [
              ['5:2:days', '5 days / 2 off'],
              ['3:1:weeks', '3 weeks / 1 off'],
              ['1:1:weeks', 'Alternate weeks'],
              ['custom', 'Custom'],
            ],
            customCycle ? 'custom' : `${cycle.on}:${cycle.off}:${cycle.unit}`,
            (key) => {
              setCustomCycle(key === 'custom');
              if (key === 'custom') return;
              const [on, off, unit] = key.split(':');
              onChange({
                ...value,
                cycle: {
                  ...cycle,
                  on: Number(on),
                  off: Number(off),
                  unit: unit as 'days' | 'weeks',
                },
              });
            },
          )}
          {customCycle && (
            <>
              {choices(
                'Cycle unit',
                [
                  ['days', 'Days'],
                  ['weeks', 'Weeks'],
                ],
                cycle.unit,
                (unit) =>
                  onChange({
                    ...value,
                    cycle: { ...cycle, unit: unit as 'days' | 'weeks' },
                  }),
              )}
              <View style={styles.wrap}>
                <NumberField
                  label="On"
                  value={cycle.on}
                  onChange={(on) =>
                    onChange({ ...value, cycle: { ...cycle, on } })
                  }
                />
                <NumberField
                  label="Off"
                  value={cycle.off}
                  onChange={(off) =>
                    onChange({ ...value, cycle: { ...cycle, off } })
                  }
                />
              </View>
            </>
          )}
          <StartDateField
            label="Cycle starts on"
            help="First day of an on period"
            value={cycle.anchor}
            onChange={(anchor) =>
              onChange({ ...value, cycle: { ...cycle, anchor } })
            }
            colour={colour}
          />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontSize: 12, color: '#999999' },
  text: { fontSize: 14, color: '#DDDDDD' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
  },
  day: {
    minWidth: 44,
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  input: {
    minHeight: 44,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#222222',
    fontSize: 17,
    color: '#EEEEEE',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#333333' },
});
