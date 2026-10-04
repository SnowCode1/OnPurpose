import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

type Feedback = 'confirm' | 'undo' | 'selection' | 'boundary';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

// Fire at accepted actions, never from render/state updaters. UI and state must
// not wait for the motor, and unavailable haptics must never break an action.
export function feedback(kind: Feedback): void {
  if (!enabled) return;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
  try {
    let result: Promise<void>;
    if (Platform.OS === 'android') {
      const effect = {
        confirm: Haptics.AndroidHaptics.Confirm,
        undo: Haptics.AndroidHaptics.Toggle_Off,
        selection: Haptics.AndroidHaptics.Segment_Tick,
        boundary: Haptics.AndroidHaptics.Gesture_Start,
      }[kind];
      result = Haptics.performAndroidHapticsAsync(effect);
    } else if (kind === 'selection') {
      result = Haptics.selectionAsync();
    } else {
      const style = {
        confirm: Haptics.ImpactFeedbackStyle.Medium,
        undo: Haptics.ImpactFeedbackStyle.Soft,
        boundary: Haptics.ImpactFeedbackStyle.Medium,
      }[kind];
      result = Haptics.impactAsync(style);
    }
    void result.catch(() => undefined);
  } catch {
    // Native support is optional; the visual state remains authoritative.
  }
}
