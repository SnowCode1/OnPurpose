import { AccessibilityInfo, Alert, AppState } from 'react-native';
import { previewFeedback } from './previewHaptics';
import { captureScreen } from 'react-native-view-shot';
import { uploadPreview } from './previewUpload';

let busy = false;
let pending: string | null = null;
export async function sharePreview(retry = false) {
  if (
    !__DEV__ ||
    process.env.EXPO_PUBLIC_DEV_PREVIEW !== 'true' ||
    AppState.currentState !== 'active' ||
    busy
  )
    return;
  const receiver = process.env.EXPO_PUBLIC_PREVIEW_URL;
  const token = process.env.EXPO_PUBLIC_PREVIEW_TOKEN;
  if (!receiver || !token) {
    Alert.alert(
      'Preview sharing needs setup',
      'Set the receiver address and pairing token in .env.local, then fully reload Expo Go.',
    );
    return;
  }
  busy = true;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    if (!retry || !pending) {
      pending = null;
      try {
        pending = await captureScreen({ format: 'png', result: 'base64' });
      } catch (error) {
        throw new Error(
          `Could not capture the screen: ${error instanceof Error ? error.message : 'unknown capture error'}`,
        );
      }
    }
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 15000);
    await uploadPreview(pending, receiver, token, fetch, controller.signal);
    pending = null;
    previewFeedback(true);
    AccessibilityInfo.announceForAccessibility('Preview saved');
    console.info('Preview saved on development computer');
  } catch (error) {
    if (AppState.currentState === 'active') {
      Alert.alert(
        'Preview not sent',
        error instanceof Error ? error.message : 'Capture or upload failed.',
        [
          { text: 'Close', style: 'cancel' },
          ...(pending
            ? [
                {
                  text: 'Retry',
                  onPress: () => {
                    void sharePreview(true);
                  },
                },
              ]
            : []),
        ],
      );
    }
  } finally {
    if (timeout) clearTimeout(timeout);
    busy = false;
  }
}
