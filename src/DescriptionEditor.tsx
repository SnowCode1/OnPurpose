import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import {
  Alert,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MAX_DESCRIPTION_LENGTH, normalizeDescription } from './description';
import RichDescription, { type RichDescriptionRef } from './RichDescription';
import { draftsFor } from './descriptionDrafts';

export function DescriptionEditor({
  title,
  colour,
  initialValue,
  baseValue = initialValue,
  draftKey,
  temporary,
  keepDraftOnApply = false,
  editable,
  Heading,
  onApply,
  onClose,
}: {
  title: string;
  colour: string;
  initialValue: string;
  baseValue?: string;
  draftKey: string;
  temporary: boolean;
  keepDraftOnApply?: boolean;
  editable: boolean;
  Heading: ComponentType<TextProps>;
  onApply: (text: string | undefined) => boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState(initialValue),
    [editorInitial, setEditorInitial] = useState(initialValue),
    [ready, setReady] = useState(false),
    [requesting, setRequesting] = useState(false),
    [loading, setLoading] = useState(true),
    [status, setStatus] = useState('');
  const editor = useRef<RichDescriptionRef>(null);
  const { fontScale } = useWindowDimensions();
  const requestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleReady = useCallback(async () => setReady(true), []);
  const latest = useRef(initialValue),
    finished = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drafts = draftsFor(temporary);
  function persist(value: string) {
    return drafts.put(draftKey, { version: 1, base: baseValue, text: value });
  }
  useEffect(() => {
    let active = true;
    void drafts
      .get(draftKey)
      .then((saved) => {
        if (!active || !saved || saved.text === initialValue) return;
        const recover = () => {
          if (!active) return;
          latest.current = saved.text;
          setText(saved.text);
          setEditorInitial(saved.text);
          setReady(false);
          setStatus('Recovered unsaved draft');
        };
        if (saved.base !== baseValue)
          Alert.alert(
            'A draft from an earlier version',
            'The saved description has changed since this draft was written.',
            [
              {
                text: 'Use saved description',
                onPress: () => {
                  void drafts.remove(draftKey).catch(() => {
                    if (active) setStatus('Couldn’t discard the older draft');
                  });
                },
              },
              { text: 'Recover draft', onPress: recover },
            ],
          );
        else recover();
      })
      .catch(() => {
        if (active)
          setStatus(
            'Draft recovery unavailable. Applied descriptions are still saved normally.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const subscription = AppState.addEventListener('change', (state) => {
      if (
        state !== 'active' &&
        !finished.current &&
        latest.current !== initialValue
      )
        void drafts
          .put(draftKey, { version: 1, base: baseValue, text: latest.current })
          .catch(() => {
            if (active)
              setStatus('Draft couldn’t be kept. Use Done to apply it.');
          });
    });
    return () => {
      active = false;
      subscription.remove();
      if (timer.current) clearTimeout(timer.current);
      if (requestTimer.current) clearTimeout(requestTimer.current);
      if (!finished.current && latest.current !== initialValue)
        void drafts
          .put(draftKey, { version: 1, base: baseValue, text: latest.current })
          .catch(() => {});
    };
  }, [drafts, draftKey, initialValue, baseValue]);
  function update(value: string) {
    if (finished.current) return;
    latest.current = value;
    setText(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void persist(value)
        .then(() => setStatus(''))
        .catch(() =>
          setStatus('Draft couldn’t be kept. Use Done to apply it.'),
        );
    }, 350);
  }
  function finish(discard: boolean, value: string) {
    Keyboard.dismiss();
    finished.current = true;
    if (timer.current) clearTimeout(timer.current);
    if (discard || !keepDraftOnApply)
      void drafts.remove(draftKey).catch(() => {});
    else void persist(value).catch(() => {});
    onClose();
  }
  function close(value: string) {
    if (value === initialValue) {
      finish(false, value);
      return;
    }
    Alert.alert(
      'Discard description changes?',
      'Your applied description will stay as it was.',
      [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard changes',
          style: 'destructive',
          onPress: () => finish(true, value),
        },
      ],
    );
  }
  function requestSnapshot(action: 'close' | 'done') {
    if (requesting) return;
    if (!ready) {
      if (action === 'close') close(latest.current);
      return;
    }
    setRequesting(true);
    requestTimer.current = setTimeout(() => {
      setRequesting(false);
      setStatus('The editor didn’t respond. Please try again.');
    }, 5000);
    editor.current?.requestSnapshot(action);
  }
  async function snapshot(action: string, value: string) {
    if (requestTimer.current) clearTimeout(requestTimer.current);
    setRequesting(false);
    if (finished.current) return;
    if (value.length > MAX_DESCRIPTION_LENGTH) {
      setStatus('The description is too long to apply.');
      return;
    }
    update(value);
    if (action === 'close') close(value);
    else if (
      action === 'done' &&
      editable &&
      onApply(normalizeDescription(value))
    )
      finish(false, value);
  }
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={() => requestSnapshot('close')}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <EditorAction
                label="Close"
                onPress={() => requestSnapshot('close')}
                colour={colour}
                disabled={requesting}
              />
              <View
                style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}
              >
                <Heading numberOfLines={1} style={styles.title}>
                  {title || 'New habit'}
                </Heading>
                <Text style={styles.subtitle}>Description</Text>
              </View>
              <EditorAction
                label="Done"
                colour={colour}
                disabled={!editable || loading || !ready || requesting}
                onPress={() => requestSnapshot('done')}
              />
            </View>
            {status ? (
              <Text accessibilityLiveRegion="polite" style={styles.status}>
                {status}
              </Text>
            ) : null}
            {!loading && (
              <RichDescription
                key={editorInitial}
                ref={editor}
                initialValue={editorInitial}
                colour={colour}
                fontScale={fontScale}
                editable={editable}
                onReady={handleReady}
                onChange={async (value) => update(value)}
                onSnapshot={snapshot}
                onLimit={async () =>
                  setStatus(
                    '20,000 character limit reached. Undo or shorten the note to keep writing.',
                  )
                }
                dom={{
                  style: { flex: 1 },
                  containerStyle: { flex: 1 },
                  scrollEnabled: false,
                  keyboardDisplayRequiresUserAction: false,
                  hideKeyboardAccessoryView: false,
                  onError: () => {
                    setReady(false);
                    setStatus(
                      'The editor could not load. Close and reopen to recover your draft.',
                    );
                  },
                }}
              />
            )}
            {text.length >= MAX_DESCRIPTION_LENGTH - 500 && (
              <Text style={styles.status}>
                {text.length.toLocaleString()} /{' '}
                {MAX_DESCRIPTION_LENGTH.toLocaleString()} characters
              </Text>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function EditorAction({
  label,
  onPress,
  colour,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  colour: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.actionText, label === 'Done' && { color: colour }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  action: {
    minWidth: 60,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionText: { color: '#BBBBBB', fontSize: 15, fontWeight: '500' },
  title: { color: '#DADADA', fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#777777', fontSize: 12, marginTop: 3 },
  status: {
    color: '#AFAFAF',
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});
