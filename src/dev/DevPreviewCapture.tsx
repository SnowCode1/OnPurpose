import { useEffect, useState } from 'react';
import { AppState, Platform, Pressable, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { previewFeedback } from './previewHaptics';
import { Text } from '../Typography';
import { previewMotionDetector } from './previewMotion';
import { sharePreview } from './previewCapture';

// Mount once above all app screens. Sensor callbacks never update React per frame.
export function DevPreviewCapture() {
  useEffect(() => {
    if (
      !__DEV__ ||
      process.env.EXPO_PUBLIC_DEV_PREVIEW !== 'true' ||
      Platform.OS === 'web'
    )
      return;
    let disposed = false;
    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    let generation = 0;
    const detector = previewMotionDetector(Platform.OS === 'ios' ? 1 : -1);
    const stop = () => {
      generation++;
      subscription?.remove();
      subscription = undefined;
      detector.reset();
    };
    const start = async () => {
      stop();
      const request = generation;
      try {
        const available = await Accelerometer.isAvailableAsync();
        if (
          !available ||
          disposed ||
          request !== generation ||
          AppState.currentState !== 'active'
        )
          return;
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z, timestamp }) => {
          const action = detector.sample({ x, y, z, at: timestamp * 1000 });
          if (action === 'armed') previewFeedback();
          if (action === 'capture') void sharePreview();
        });
      } catch {
        console.info(
          'Preview motion unavailable; use title hold or Settings → Development → Share preview.',
        );
      }
    };
    if (AppState.currentState === 'active') void start();
    const state = AppState.addEventListener('change', (value) => {
      if (value === 'active') void start();
      else stop();
    });
    return () => {
      disposed = true;
      state.remove();
      stop();
    };
  }, []);
  return null;
}

export function DevPreviewControls() {
  const [sharing, setSharing] = useState(false);
  if (
    !__DEV__ ||
    process.env.EXPO_PUBLIC_DEV_PREVIEW !== 'true' ||
    Platform.OS === 'web'
  )
    return null;
  return (
    <View style={{ gap: 8, marginBottom: 24 }}>
      <Pressable
        accessibilityRole="button"
        disabled={sharing}
        accessibilityState={{ disabled: sharing }}
        style={{ minHeight: 44, justifyContent: 'center' }}
        onPress={() => {
          setSharing(true);
          void sharePreview().finally(() => setSharing(false));
        }}
      >
        <Text style={{ color: '#DDDDDD', fontSize: 17 }}>
          {sharing ? 'Sharing preview…' : 'Share preview'}
        </Text>
      </Pressable>
      <Text style={{ color: '#969696', fontSize: 14, lineHeight: 21 }}>
        From any screen, turn the phone face down until a firm tap, then turn it
        back toward you and pause. Preview sharing is development only.
      </Text>
    </View>
  );
}
