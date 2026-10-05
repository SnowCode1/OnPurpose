import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';

// Deliberate preview actions use stronger cues than routine habit interactions.
// One firm tap means turn back; two mean the receiver confirmed the save.
export function previewFeedback(saved = false) {
  void (async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (saved) {
      await new Promise<void>((resolve) => setTimeout(resolve, 110));
      if (AppState.currentState === 'active')
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  })().catch(() => undefined);
}
