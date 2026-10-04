import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  AccessibilityInfo,
  Alert,
  Platform,
  Pressable,
  type PressableProps,
  Text,
  type TextProps,
} from 'react-native';
import { captureScreen } from 'react-native-view-shot';

function usePreviewGesture(
  props: Pick<TextProps, 'accessibilityActions' | 'onAccessibilityAction'>,
) {
  const busy = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  async function sharePreview() {
    if (
      !__DEV__ ||
      process.env.EXPO_PUBLIC_DEV_PREVIEW !== 'true' ||
      busy.current
    )
      return;
    const receiver = process.env.EXPO_PUBLIC_PREVIEW_URL?.replace(/\/$/, '');
    const token = process.env.EXPO_PUBLIC_PREVIEW_TOKEN;
    if (!receiver || !token) {
      Alert.alert(
        'Preview sharing needs setup',
        'Set the receiver address and pairing token in .env.local, then reload the app.',
      );
      return;
    }

    busy.current = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      // The heading has no pressed style; capture without changing the visible UI.
      const png = await captureScreen({ format: 'png', result: 'base64' });
      if (!mounted.current) return;
      const controller = new AbortController();
      request.current = controller;
      timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${receiver}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ png }),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 401)
          throw new Error(
            'The pairing tokens do not match. Restart the receiver and reload the app after updating .env.local.',
          );
        if (response.status === 413)
          throw new Error(
            'This image exceeds the receiver’s 12 MB upload limit.',
          );
        throw new Error(
          `The receiver could not save the preview (HTTP ${response.status}).`,
        );
      }
      const result = await response.json();
      if (result.saved !== true)
        throw new Error(
          'The receiver did not confirm that the image was saved.',
        );
      if (mounted.current) {
        // A failed/disabled haptic must never turn a saved image into an error.
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
        AccessibilityInfo.announceForAccessibility('Preview saved');
        console.info('Preview saved on development computer');
      }
    } catch (error) {
      if (mounted.current) {
        const detail =
          error instanceof Error ? error.message : 'Capture or upload failed.';
        Alert.alert(
          'Preview not sent',
          `${detail}\n\nCheck that npm run preview:server is running and both devices can reach the receiver on the same network. Then try again.`,
        );
      }
    } finally {
      if (timeout) clearTimeout(timeout);
      request.current = null;
      busy.current = false;
    }
  }

  return {
    onLongPress: sharePreview,
    accessibilityHint:
      'Touch and hold to share an app preview with your development computer',
    accessibilityActions: [
      ...(props.accessibilityActions ?? []),
      { name: 'sharePreview', label: 'Share preview' },
    ],
    onAccessibilityAction: (
      event: Parameters<NonNullable<TextProps['onAccessibilityAction']>>[0],
    ) => {
      if (event.nativeEvent.actionName === 'sharePreview') void sharePreview();
      else props.onAccessibilityAction?.(event);
    },
  };
}

export function DevPreviewText(props: TextProps) {
  const gesture = usePreviewGesture(props);
  if (Platform.OS === 'web') return <Text {...props} />;
  return <Text {...props} {...gesture} suppressHighlighting />;
}

export function DevPreviewButton(props: PressableProps) {
  const gesture = usePreviewGesture(props);
  if (Platform.OS === 'web') return <Pressable {...props} />;
  return <Pressable {...props} {...gesture} />;
}
