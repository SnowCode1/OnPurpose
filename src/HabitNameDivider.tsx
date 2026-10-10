import { StyleSheet, View } from 'react-native';
import { themedStyles } from './ThemeContext';
export function HabitNameDivider() {
  const styles = useStyles();
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
const useStyles = themedStyles((t) => ({
  names: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: t.overlay(0x20),
  },
}));
