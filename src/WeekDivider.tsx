import { StyleSheet, View } from 'react-native';
// Overlay, rather than a layout border: the week marker cannot shift a date or
// shrink a touch target. It follows the same column in the header and body.
export function WeekDivider() {
  return (
    <View
      testID="week-divider"
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.divider}
    />
  );
}
const styles = StyleSheet.create({
  divider: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#FFFFFF20',
  },
});
