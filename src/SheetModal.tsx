import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themedStyles, useTheme } from './ThemeContext';

const orientations = ['portrait', 'landscape-left', 'landscape-right'] as const;
const settle = {
  duration: 200,
  easing: Easing.out(Easing.cubic),
  reduceMotion: ReduceMotion.System,
};
// Points of movement before a touch counts as a drag; below Android's own
// scroll slop, so the sheet decides before a list starts scrolling.
const DRAG_SLOP = 8;

type SheetScrollState = {
  // Scroll offset under the current touch: 0 outside lists, -1 until known.
  touchY: SharedValue<number>;
  claim: (offset: number) => void;
};
const SheetScroll = createContext<SheetScrollState | null>(null);

// iOS keeps the native UIKit page sheet and its swipe dismissal. Android has
// no page sheet and never reports Modal onDismiss, so it gets a sheet that a
// downward drag closes, like iOS: from anywhere when the touched content is at
// its top. onDismiss follows closing.
export function SheetModal({
  visible = true,
  onClose,
  onDismiss,
  children,
}: {
  visible?: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  const theme = useTheme();
  if (Platform.OS === 'ios')
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        allowSwipeDismissal
        supportedOrientations={[...orientations]}
        onRequestClose={onClose}
        onDismiss={onDismiss}
        backdropColor={theme.background}
      >
        {children}
      </Modal>
    );
  return (
    <AndroidSheet visible={visible} onClose={onClose} onDismiss={onDismiss}>
      {children}
    </AndroidSheet>
  );
}

// Spread onto every vertical list inside a sheet. It reports the list's scroll
// position so a downward drag scrolls the list until it reaches the top, and
// only then closes the sheet. Outside an Android sheet it adds nothing.
export function useSheetScroll() {
  const sheet = useContext(SheetScroll);
  const offset = useRef(0);
  return useMemo(
    () =>
      sheet
        ? {
            scrollEventThrottle: 16,
            onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
              offset.current = event.nativeEvent.contentOffset.y;
            },
            onTouchStart: () => sheet.claim(offset.current),
          }
        : undefined,
    [sheet],
  );
}

// Swipe-down dismissal shared by Android sheets and the daily entry sheet.
// The pan activates only for a downward drag whose touched list is at its top
// (see useSheetScroll); otherwise lists, paging and buttons keep the touch.
// `drag` follows the finger; onSwipe runs when a release passes `threshold`.
export function useSwipeDismiss(
  onSwipe: (drag: SharedValue<number>) => void,
  threshold: number,
) {
  const drag = useSharedValue(0);
  const touchY = useSharedValue(-1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const claimed = useRef(false);
  const latest = useRef(onSwipe);
  useLayoutEffect(() => {
    latest.current = onSwipe;
  });
  const scroll = useMemo(
    () => ({
      touchY,
      claim: (y: number) => {
        claimed.current = true;
        touchY.set(y);
      },
    }),
    [touchY],
  );
  // Lists claim the touch first (events bubble up); anything else, such as a
  // title bar, counts as being at the top. Attach to the dragged view.
  const onTouchStart = useCallback(() => {
    if (!claimed.current) touchY.set(0);
    claimed.current = false;
  }, [touchY]);
  const gesture = useMemo(() => {
    const swiped = () => latest.current(drag);
    return (
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesDown((event) => {
          const touch = event.changedTouches[0];
          startX.set(touch.absoluteX);
          startY.set(touch.absoluteY);
        })
        .onTouchesMove((event, manager) => {
          const touch = event.allTouches[0];
          if (event.numberOfTouches !== 1 || !touch) return manager.fail();
          const dx = touch.absoluteX - startX.get();
          const dy = touch.absoluteY - startY.get();
          // Sideways paging and upward scrolling always belong to the content.
          if (Math.abs(dx) > DRAG_SLOP && Math.abs(dx) > Math.abs(dy))
            manager.fail();
          else if (dy < -DRAG_SLOP) manager.fail();
          else if (dy > DRAG_SLOP) {
            // Lists report their position from JavaScript; on a quick flick that
            // can arrive after the first moves, so wait rather than guess.
            const y = touchY.get();
            if (y === -1) return;
            if (y <= 0) manager.activate();
            else manager.fail();
          }
        })
        .onUpdate((event) => {
          drag.set(Math.max(0, event.translationY - DRAG_SLOP));
        })
        // Gesture callbacks run on touch, not render; onSwipe is the latest prop.
        // eslint-disable-next-line react-hooks/refs
        .onEnd((event) => {
          const distance = drag.get();
          if (distance > threshold || (distance > 24 && event.velocityY > 900))
            runOnJS(swiped)();
          else drag.set(withTiming(0, settle));
        })
        .onFinalize(() => {
          touchY.set(-1);
        })
    );
  }, [threshold, drag, startX, startY, touchY]);
  return { gesture, drag, scroll, onTouchStart };
}
export const SheetScrollProvider = SheetScroll.Provider;
// A vertical ScrollView that reports its position to the enclosing sheet.
export function SheetScrollView(props: ScrollViewProps) {
  const sheetScroll = useSheetScroll();
  return <ScrollView {...props} {...sheetScroll} />;
}

function AndroidSheet({
  visible,
  onClose,
  onDismiss,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  children: ReactNode;
}) {
  const styles = useStyles();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const latest = useRef({ onClose, onDismiss });
  useLayoutEffect(() => {
    latest.current = { onClose, onDismiss };
  });
  const {
    gesture,
    drag: offset,
    scroll,
    onTouchStart,
  } = useSwipeDismiss((drag) => {
    const close = () => latest.current.onClose();
    drag.set(
      withTiming(height, settle, (done) => {
        if (done) runOnJS(close)();
      }),
    );
  }, height * 0.2);
  const shown = useRef(visible);
  useEffect(() => {
    if (visible) offset.set(0);
    else if (shown.current) latest.current.onDismiss?.();
    shown.current = visible;
  }, [visible, offset]);
  // Unmounting while shown (statistics closing) is also a completed dismissal.
  useEffect(
    () => () => {
      if (shown.current) latest.current.onDismiss?.();
    },
    [],
  );
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="slide"
      supportedOrientations={[...orientations]}
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          accessible={false}
          importantForAccessibility="no"
          onPress={onClose}
          style={{ height: insets.top + 10 }}
        />
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[styles.sheet, sheetStyle]}
            onTouchStart={onTouchStart}
          >
            <View
              importantForAccessibility="no-hide-descendants"
              style={styles.handleArea}
            >
              <View style={styles.handle} />
            </View>
            <SheetScroll.Provider value={scroll}>
              <View style={styles.content}>{children}</View>
            </SheetScroll.Provider>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const useStyles = themedStyles((t) => ({
  root: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: t.background,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: t.ink(0x2a),
    overflow: 'hidden',
  },
  handleArea: { height: 18, alignItems: 'center', justifyContent: 'center' },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: t.ink(0x3a),
  },
  content: { flex: 1 },
}));
