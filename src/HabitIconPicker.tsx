import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { habitIconLabel, isSingleEmoji, type HabitIcon } from './habitIcons';
import { searchHabitIcons } from './searchHabitIcons';
import { HabitSymbol } from './HabitSymbol';

const emojiChoices = [
  '🚶',
  '🏃',
  '🏋️',
  '🚴',
  '🧘',
  '💧',
  '☕',
  '🥗',
  '🍎',
  '💊',
  '🪥',
  '🛏️',
  '🌙',
  '☀️',
  '🌿',
  '📖',
  '✍️',
  '📓',
  '🎓',
  '🧠',
  '🎵',
  '🎹',
  '🎨',
  '💻',
  '🎯',
  '🧹',
  '🏠',
  '📞',
  '💬',
  '❤️',
  '🐾',
  '💰',
];
type Choice = { value: HabitIcon; label: string };
export function HabitIconPicker({
  icon,
  colour,
  onChange,
}: {
  icon?: HabitIcon;
  colour: string;
  onChange: (icon: HabitIcon | undefined | null) => void;
}) {
  const { height } = useWindowDimensions();
  const [width, setWidth] = useState(280);
  const [tab, setTab] = useState<'none' | 'phosphor' | 'emoji'>(
    icon?.startsWith('emoji:') ? 'emoji' : icon ? 'phosphor' : 'none',
  );
  const [selected, setSelected] = useState(icon);
  const [emoji, setEmoji] = useState(
    icon?.startsWith('emoji:') ? icon.slice(6) : '',
  );
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const validEmoji = isSingleEmoji(emoji.trim());
  const columns = Math.max(1, Math.floor((width + 8) / 56));
  const choices = useMemo<Choice[]>(
    () =>
      tab === 'phosphor'
        ? searchHabitIcons(search, showAll).map((item) => ({
            value: `phosphor:${item.id}`,
            label: item.label,
          }))
        : tab === 'emoji'
          ? emojiChoices.map((value) => ({
              value: `emoji:${value}`,
              label: `Use ${value}`,
            }))
          : [],
    [tab, search, showAll],
  );
  const rows = useMemo(() => {
    const result: Choice[][] = [];
    for (let i = 0; i < choices.length; i += columns)
      result.push(choices.slice(i, i + columns));
    return result;
  }, [choices, columns]);
  function choose(value: HabitIcon | undefined) {
    setSelected(value);
    onChange(value);
  }
  return (
    <View
      style={{ height: Math.min(440, height * 0.5), flexShrink: 1 }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <FlatList
        style={{ flex: 1 }}
        data={rows}
        keyExtractor={(row) => row[0].value}
        extraData={selected}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 4 }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: 16 }}>
            <View style={styles.tabs}>
              {(['none', 'phosphor', 'emoji'] as const).map((value) => (
                <Pressable
                  key={value}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === value }}
                  onPress={() => {
                    setTab(value);
                    if (value === 'none') choose(undefined);
                    else if (value === 'emoji')
                      onChange(validEmoji ? `emoji:${emoji.trim()}` : null);
                    else
                      onChange(
                        selected?.startsWith('phosphor:') ? selected : null,
                      );
                  }}
                  style={[styles.tab, tab === value && styles.active]}
                >
                  <Text style={styles.text}>
                    {value === 'none'
                      ? 'None'
                      : value === 'phosphor'
                        ? 'Icons'
                        : 'Emoji'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tab === 'none' ? (
              <View style={styles.empty}>
                <Text style={styles.text}>Just the habit name</Text>
                <Text style={styles.description}>
                  Icons are optional. Choose one whenever it helps you recognise
                  a habit.
                </Text>
              </View>
            ) : tab === 'phosphor' ? (
              <>
                <TextInput
                  accessibilityLabel="Search all Phosphor icons"
                  placeholder="Search all 1,512 icons"
                  placeholderTextColor="#777777"
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                  style={styles.input}
                />
                <View style={styles.scopeRow}>
                  {([false, true] as const).map((all) => (
                    <Pressable
                      key={String(all)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: showAll === all }}
                      onPress={() => {
                        setShowAll(all);
                        setSearch('');
                      }}
                      style={[styles.scope, showAll === all && styles.active]}
                    >
                      <Text style={styles.text}>
                        {all ? 'All icons' : 'Common'}
                      </Text>
                    </Pressable>
                  ))}
                  <Text style={styles.count}>{choices.length}</Text>
                </View>
                <Text style={styles.description}>
                  {selected?.startsWith('phosphor:')
                    ? habitIconLabel(selected)
                    : 'Choose an icon'}
                  {search.trim() ? ' · All icons searched' : ' · Phosphor'}
                </Text>
                {choices.length === 0 && (
                  <Text style={styles.description}>
                    No matching icons. Try another word.
                  </Text>
                )}
              </>
            ) : (
              <>
                <TextInput
                  accessibilityLabel="Habit emoji"
                  placeholder="Type or paste one emoji"
                  placeholderTextColor="#777777"
                  value={emoji}
                  maxLength={64}
                  onChangeText={(text) => {
                    setEmoji(text);
                    const value = text.trim();
                    setSelected(
                      isSingleEmoji(value) ? `emoji:${value}` : undefined,
                    );
                    onChange(isSingleEmoji(value) ? `emoji:${value}` : null);
                  }}
                  autoCorrect={false}
                  style={[styles.input, { fontSize: 22 }]}
                />
                <Text style={styles.description}>
                  {emoji && !validEmoji
                    ? 'Choose a single emoji, including a skin tone or joined emoji if you like.'
                    : 'Use your emoji keyboard, or choose one below.'}
                </Text>
              </>
            )}
          </View>
        }
        renderItem={({ item: row }) => (
          <View style={styles.gridRow}>
            {row.map(({ value, label }) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: selected === value }}
                onPress={() => {
                  if (value.startsWith('emoji:')) setEmoji(value.slice(6));
                  choose(value);
                }}
                style={[
                  styles.choice,
                  { borderColor: selected === value ? colour : 'transparent' },
                ]}
              >
                <HabitSymbol icon={value} colour={colour} size={25} />
              </Pressable>
            ))}
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  active: { backgroundColor: '#343434' },
  text: { color: '#DDDDDD', fontSize: 14, fontWeight: '500' },
  description: { color: '#999999', fontSize: 12, lineHeight: 18 },
  empty: { paddingVertical: 22, gap: 12 },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 12,
    color: '#EEEEEE',
    fontSize: 16,
    minHeight: 48,
  },
  scopeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scope: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 10,
  },
  count: {
    color: '#888888',
    fontSize: 12,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  gridRow: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  choice: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    borderWidth: 1.5,
  },
});
