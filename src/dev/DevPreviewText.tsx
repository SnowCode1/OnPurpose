import { Text } from '../Typography';
import {
  Platform,
  Pressable,
  type PressableProps,
  type TextProps,
} from 'react-native';
import { sharePreview } from './previewCapture';

function usePreviewGesture(
  props: Pick<TextProps, 'accessibilityActions' | 'onAccessibilityAction'>,
) {
  return {
    onLongPress: () => {
      void sharePreview();
    },
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
