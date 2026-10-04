import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { habitIconCatalog } from './habitIconCatalog';
import { habitIconLabel, isSingleEmoji, type HabitIcon } from './habitIcons';
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
export function HabitIconPicker({
  icon,
  colour,
  onChange,
}: {
  icon?: HabitIcon;
  colour: string;
  onChange: (icon: HabitIcon | undefined | null) => void;
}) {
  const [tab, setTab] = useState<'none' | 'phosphor' | 'emoji'>(
    icon?.startsWith('emoji:') ? 'emoji' : icon ? 'phosphor' : 'none',
  );
  const [selected, setSelected] = useState(icon);
  const [emoji, setEmoji] = useState(
    icon?.startsWith('emoji:') ? icon.slice(6) : '',
  );
  const [search, setSearch] = useState('');
  const validEmoji = isSingleEmoji(emoji.trim());
  function choose(value: HabitIcon | undefined) {
    setSelected(value);
    onChange(value);
  }
  return (
    <View style={{ gap: 16 }}>
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
                onChange(selected?.startsWith('phosphor:') ? selected : null);
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
            Icons are optional. Choose one whenever it helps you recognise a
            habit.
          </Text>
        </View>
      ) : tab === 'phosphor' ? (
        <>
          <TextInput
            accessibilityLabel="Search habit icons"
            placeholder="Search icons"
            placeholderTextColor="#777777"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            style={styles.input}
          />
          <Text style={styles.description}>
            Phosphor ·{' '}
            {selected?.startsWith('phosphor:')
              ? habitIconLabel(selected)
              : 'Choose an icon'}
          </Text>
          <View style={styles.grid}>
            {habitIconCatalog
              .filter((item) =>
                `${item.label} ${item.tags}`
                  .toLowerCase()
                  .includes(search.trim().toLowerCase()),
              )
              .map((item) => {
                const value: HabitIcon = `phosphor:${item.id}`;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: selected === value }}
                    onPress={() => choose(value)}
                    style={[
                      styles.choice,
                      {
                        borderColor:
                          selected === value ? colour : 'transparent',
                      },
                    ]}
                  >
                    <HabitSymbol icon={value} colour={colour} size={25} />
                  </Pressable>
                );
              })}
          </View>
          {!habitIconCatalog.some((item) =>
            `${item.label} ${item.tags}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()),
          ) && (
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
          <View style={styles.grid}>
            {emojiChoices.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`Use ${value}`}
                accessibilityState={{ selected: emoji.trim() === value }}
                onPress={() => {
                  setEmoji(value);
                  choose(`emoji:${value}`);
                }}
                style={[
                  styles.choice,
                  {
                    borderColor:
                      emoji.trim() === value ? colour : 'transparent',
                  },
                ]}
              >
                <HabitSymbol
                  icon={`emoji:${value}`}
                  colour={colour}
                  size={25}
                />
              </Pressable>
            ))}
          </View>
        </>
      )}
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
