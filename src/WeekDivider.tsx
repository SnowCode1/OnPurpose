import { StyleSheet, View } from 'react-native';
// Both are overlays: they cannot shrink a date, name or touch target.
export function WeekDivider({
  enabled = true,
  startsWeek = false,
  endsWeek = false,
}: {
  enabled?: boolean;
  startsWeek?: boolean;
  endsWeek?: boolean;
}) {
  return (
    <View
      testID={enabled ? 'week-divider' : 'date-header-rule'}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.week,
        {
          left: enabled && startsWeek ? 4 : 0,
          right: enabled && endsWeek ? 4 : 0,
          height: enabled ? 1.5 : StyleSheet.hairlineWidth,
          backgroundColor: enabled ? '#626262' : '#363636',
          borderTopLeftRadius: enabled && startsWeek ? 1 : 0,
          borderBottomLeftRadius: enabled && startsWeek ? 1 : 0,
          borderTopRightRadius: enabled && endsWeek ? 1 : 0,
          borderBottomRightRadius: enabled && endsWeek ? 1 : 0,
        },
      ]}
    />
  );
}
export function HabitNameDivider() {
  return (
    <View
      testID="habit-name-divider"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.names}
    />
  );
}
const styles = StyleSheet.create({
  week: {
    position: 'absolute',
    bottom: 0,
  },
  names: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF20',
  },
});
