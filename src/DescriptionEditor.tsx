import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  Alert,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  MAX_DESCRIPTION_LENGTH,
  insertDescriptionMarkup,
  normalizeDescription,
} from './description';
import { DescriptionText } from './DescriptionText';
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
    [preview, setPreview] = useState(false),
    [loading, setLoading] = useState(true),
    [status, setStatus] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const input = useRef<TextInput>(null);
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
      if (!finished.current && latest.current !== initialValue)
        void drafts
          .put(draftKey, { version: 1, base: baseValue, text: latest.current })
          .catch(() => {});
    };
  }, [drafts, draftKey, initialValue, baseValue]);
  useEffect(() => {
    if (!loading && !preview && editable) input.current?.focus();
  }, [loading, preview, editable]);
  function update(value: string) {
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
  function finish(discard: boolean) {
    Keyboard.dismiss();
    finished.current = true;
    if (timer.current) clearTimeout(timer.current);
    if (discard || !keepDraftOnApply)
      void drafts.remove(draftKey).catch(() => {});
    else void persist(text).catch(() => {});
    onClose();
  }
  function close() {
    if (text === initialValue) {
      finish(false);
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
          onPress: () => finish(true),
        },
      ],
    );
  }
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={close}
      onShow={() => {
        if (!loading && !preview && editable) input.current?.focus();
      }}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <EditorAction label="Close" onPress={close} colour={colour} />
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
                disabled={!editable || loading}
                onPress={() => {
                  if (onApply(normalizeDescription(text))) finish(false);
                }}
              />
            </View>
            <View style={styles.tools}>
              <View style={styles.tabs}>
                {['Write', 'Preview'].map((label, index) => (
                  <Pressable
                    key={label}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: preview === !!index }}
                    onPress={() => {
                      Keyboard.dismiss();
                      setPreview(!!index);
                    }}
                    style={[
                      styles.tab,
                      preview === !!index && { backgroundColor: '#292929' },
                    ]}
                  >
                    <Text style={styles.toolText}>{label}</Text>
                  </Pressable>
                ))}
              </View>
              {!preview && (
                <View style={{ flexDirection: 'row' }}>
                  {(['bold', 'list', 'link'] as const).map((kind) => (
                    <Pressable
                      key={kind}
                      accessibilityRole="button"
                      accessibilityLabel={`Insert ${kind}`}
                      disabled={loading || !editable}
                      onPress={() => {
                        const result = insertDescriptionMarkup(
                          text,
                          selection,
                          kind,
                        );
                        if (result.text.length <= MAX_DESCRIPTION_LENGTH) {
                          update(result.text);
                          setSelection(result.selection);
                          input.current?.focus();
                        }
                      }}
                      style={styles.tool}
                    >
                      <Text
                        style={[
                          styles.toolText,
                          kind === 'bold' && { fontWeight: '700' },
                        ]}
                      >
                        {kind === 'bold' ? 'B' : kind === 'list' ? '•' : 'Link'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            {status ? (
              <Text accessibilityLiveRegion="polite" style={styles.status}>
                {status}
              </Text>
            ) : null}
            {preview ? (
              <ScrollView
                contentContainerStyle={styles.preview}
                keyboardShouldPersistTaps="handled"
              >
                {text.trim() ? (
                  <DescriptionText text={text} colour={colour} />
                ) : (
                  <Text style={styles.subtitle}>
                    Your description preview will appear here.
                  </Text>
                )}
              </ScrollView>
            ) : (
              <TextInput
                ref={input}
                accessibilityLabel="Habit description, Markdown or plain text"
                multiline
                editable={!loading && editable}
                value={text}
                onChangeText={update}
                onSelectionChange={(event) =>
                  setSelection(event.nativeEvent.selection)
                }
                selection={selection}
                maxLength={MAX_DESCRIPTION_LENGTH}
                selectionColor={colour}
                placeholder="Why this matters, a simple starting point, or a link to my notes…"
                placeholderTextColor="#666666"
                textAlignVertical="top"
                style={styles.input}
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
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252525',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#151515',
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 8,
  },
  tool: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolText: { color: '#BBBBBB', fontSize: 13 },
  input: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    color: '#DDDDDD',
    fontSize: 17,
    lineHeight: 26,
  },
  preview: { padding: 24, flexGrow: 1 },
  status: {
    color: '#AFAFAF',
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
});
