import { Dimensions } from 'react-native';

// The physical screen, not the app window: Android windows exclude system bars,
// which would make the same phone's automatic rows depend on navigation mode.
export function screenLongSide() {
  const { width, height } = Dimensions.get('screen');
  return Math.max(width, height);
}
