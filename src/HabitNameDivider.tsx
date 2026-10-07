import { StyleSheet, View } from 'react-native';
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
  names: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF20',
  },
});
