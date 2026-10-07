import { StyleSheet, View } from 'react-native';
// Both are overlays: they cannot shrink a date, name or touch target.
export function WeekDivider() {
  return (
    <View
      testID="week-divider"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.week}
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
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 1,
    backgroundColor: '#777777',
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
