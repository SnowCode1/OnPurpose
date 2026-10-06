import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextProps,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Text, TextInput } from './Typography';
import { Icon } from './Icon';
import { HabitSymbol } from './HabitSymbol';
import { StartDateField } from './StartDateField';
import { InfoNote } from './InfoNote';
import { habitType, type Habit } from './habits';
import {
  allWeekdays,
  resolveGoalDraft,
  ruleIsMet,
  type HabitGoal,
  type SuccessRule,
} from './habitGoals';
import { goalDraftIssue, parseGoalAmount } from './goalEditing';
import { colorOnBlack } from './colors';
import { sameValue } from './storage/model';
import { appear } from './motion';
import type { EntryValue } from './entries';

function Choices({
  label,
  options,
  value,
  onChange,
  colour,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
  colour: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        {options.map(([id, name]) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${name}`}
            accessibilityState={{ selected: value === id }}
            aria-pressed={value === id}
            onPress={() => onChange(id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor:
                  value === id ? colorOnBlack(colour, 0.18) : '#222222',
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Text style={[styles.control, value === id && { color: colour }]}>
              {name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
function Disclosure({
  label,
  detail,
  expanded,
  onPress,
  children,
}: {
  label: string;
  detail?: string;
  expanded: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: expanded ? 12 : 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.disclosure,
          { opacity: pressed ? 0.65 : 1 },
        ]}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.control}>{label}</Text>
          {!!detail && (
            <Text numberOfLines={2} style={styles.note}>
              {detail}
            </Text>
          )}
        </View>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevron" size={16} color="#888888" />
        </View>
      </Pressable>
      {expanded && (
        <Animated.View entering={appear} style={styles.group}>
          {children}
        </Animated.View>
      )}
    </View>
  );
}

export function GoalVersionForm({
  habit,
  initial,
  existing,
  today,
  editable,
  Heading,
  onClose,
  onSave,
  onRemove,
  onTimeline,
  onDirtyChange,
}: {
  habit: Habit;
  initial: HabitGoal;
  existing: boolean;
  today: string;
  editable: boolean;
  Heading: ComponentType<TextProps>;
  onClose: () => void;
  onSave: (goal: HabitGoal) => void;
  onRemove: () => void;
  onTimeline: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const type = habitType(habit);
  const [from, setFrom] = useState(initial.from);
  const [kind, setKind] = useState<SuccessRule['kind']>(initial.rule.kind);
  const [operator, setOperator] = useState(
    initial.rule.kind === 'number' ? initial.rule.operator : 'atLeast',
  );
  const [target, setTarget] = useState(
    initial.rule.kind === 'number' ? String(initial.rule.target) : '',
  );
  const [upper, setUpper] = useState(
    initial.rule.kind === 'number' ? String(initial.rule.upper ?? '') : '',
  );
  const [match, setMatch] = useState<'any' | 'all' | 'count'>(
    initial.rule.kind === 'categories' || initial.rule.kind === 'text'
      ? initial.rule.match
      : 'any',
  );
  const [ids, setIds] = useState(
    initial.rule.kind === 'categories' ? initial.rule.ids : [],
  );
  const [exclude, setExclude] = useState(
    initial.rule.kind === 'categories' ? initial.rule.exclude : [],
  );
  const [count, setCount] = useState(
    initial.rule.kind === 'categories' ? String(initial.rule.count ?? 1) : '1',
  );
  const [terms, setTerms] = useState(
    initial.rule.kind === 'text' ? initial.rule.terms.join('\n') : '',
  );
  const [weekdays, setWeekdays] = useState(initial.weekdays);
  const [tryOpen, setTryOpen] = useState(false),
    [testText, setTestText] = useState(''),
    [testIds, setTestIds] = useState<string[]>([]);
  const parse = parseGoalAmount;
  const rule: SuccessRule =
    kind === 'number'
      ? {
          kind,
          operator,
          target: parse(target),
          ...(operator === 'between' ? { upper: parse(upper) } : {}),
        }
      : kind === 'categories'
        ? {
            kind,
            match,
            ids: match === 'count' ? [] : [...ids].sort(),
            exclude: [...exclude].sort(),
            ...(match === 'count' ? { count: parse(count) } : {}),
          }
        : kind === 'text'
          ? {
              kind,
              match: match === 'all' ? 'all' : 'any',
              terms: terms
                .split('\n')
                .map((term) => term.trim())
                .filter(Boolean),
            }
          : { kind };
  const goal: HabitGoal = resolveGoalDraft(
    habit.goals,
    {
      id: initial.id,
      from,
      rule,
      weekdays: [...weekdays].sort((a, b) => a - b),
    },
    existing,
  );
  const issue = goalDraftIssue(habit, goal);
  const valid = issue === null;
  const changed = !sameValue(
    goal,
    resolveGoalDraft(habit.goals, initial, existing),
  );
  useEffect(() => onDirtyChange(changed), [changed, onDirtyChange]);
  const [exclusionsOpen, setExclusionsOpen] = useState(false);
  const field = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    numeric = true,
  ) => (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        multiline={!numeric}
        maxLength={numeric ? 20 : 2400}
        selectionColor={habit.color}
        style={styles.input}
      />
    </View>
  );
  const toggle = (items: string[], id: string) =>
    items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
  function chooseCategory(id: string, excluding = false) {
    if (excluding) {
      setExclude((previous) => toggle(previous, id));
      setIds((previous) => previous.filter((item) => item !== id));
    } else {
      setIds((previous) => toggle(previous, id));
      setExclude((previous) => previous.filter((item) => item !== id));
    }
  }
  const categoryChoices = (
    label: string,
    selected: string[],
    onToggle: (id: string) => void,
  ) => (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrap}>
        {habit.categories?.map((option) => (
          <Pressable
            key={option.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected.includes(option.id) }}
            aria-checked={selected.includes(option.id)}
            accessibilityLabel={`${label}, ${option.label}${option.archived ? ', archived' : ''}`}
            onPress={() => onToggle(option.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected.includes(option.id)
                  ? colorOnBlack(habit.color, 0.18)
                  : '#222222',
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.control,
                selected.includes(option.id) && { color: habit.color },
              ]}
            >
              {option.label}
              {option.archived ? ' · archived' : ''}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
  const testValue: EntryValue | undefined =
    type === 'number'
      ? Number.isFinite(parse(testText))
        ? parse(testText)
        : undefined
      : type === 'categorical'
        ? testIds.length
          ? testIds
          : undefined
        : type === 'checkbox'
          ? testText === '1'
            ? 1
            : undefined
          : testText.trim()
            ? testText
            : undefined;
  const testMet = valid && ruleIsMet(rule, testValue);
  const excludedLabels = habit.categories
    ?.filter((option) => exclude.includes(option.id))
    .map((option) => option.label)
    .join(' · ');
  const title = existing
    ? initial.from < today
      ? 'Earlier goal'
      : initial.from > today
        ? 'Scheduled goal'
        : 'Edit goal'
    : 'Goal';
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close goal without applying changes"
          onPress={onClose}
          style={styles.action}
        >
          <Text style={styles.control}>Close</Text>
        </Pressable>
        <Heading style={styles.title}>{title}</Heading>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply goal version"
          disabled={!valid || !editable}
          onPress={() => onSave(goal)}
          style={[styles.action, { opacity: valid && editable ? 1 : 0.35 }]}
        >
          <Text
            style={[styles.control, { color: habit.color, fontWeight: '600' }]}
          >
            Done
          </Text>
        </Pressable>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.body}
      >
        <View style={styles.identity}>
          <HabitSymbol icon={habit.icon} colour={habit.color} size={23} />
          <Text style={[styles.habit, { color: habit.color }]}>
            {habit.name}
          </Text>
        </View>
        <View style={styles.card}>
          {type === 'checkbox' ? (
            <View style={styles.inline}>
              <Icon name="checked" color={habit.color} size={23} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.control}>Complete when checked</Text>
              </View>
            </View>
          ) : (
            <Choices
              label="Completion"
              colour={habit.color}
              value={kind}
              onChange={(value) => setKind(value as SuccessRule['kind'])}
              options={[
                ['none', 'Track only'],
                [
                  'recorded',
                  type === 'text'
                    ? 'Text entered'
                    : type === 'categorical'
                      ? 'Any selection'
                      : 'Total entered',
                ],
                [
                  type === 'number'
                    ? 'number'
                    : type === 'categorical'
                      ? 'categories'
                      : 'text',
                  type === 'number'
                    ? 'Target'
                    : type === 'categorical'
                      ? 'Match'
                      : 'Match text',
                ],
              ]}
            />
          )}
          {kind === 'number' && (
            <Animated.View entering={appear} style={styles.stack}>
              <Choices
                label="Comparison"
                colour={habit.color}
                value={operator}
                onChange={(value) => setOperator(value as typeof operator)}
                options={[
                  ['atLeast', 'At least'],
                  ['atMost', 'At most'],
                  ['between', 'Between'],
                  ['exactly', 'Exactly'],
                ]}
              />
              <View style={styles.wrap}>
                <View style={{ flex: 1, minWidth: 100 }}>
                  {field(
                    operator === 'between'
                      ? 'Lower limit'
                      : `Target${habit.unit ? ` (${habit.unit})` : ''}`,
                    target,
                    setTarget,
                  )}
                </View>
                {operator === 'between' && (
                  <View style={{ flex: 1, minWidth: 100 }}>
                    {field('Upper limit', upper, setUpper)}
                  </View>
                )}
              </View>
            </Animated.View>
          )}
          {kind === 'categories' && (
            <Animated.View entering={appear} style={styles.stack}>
              <Choices
                label="Match"
                colour={habit.color}
                value={match}
                onChange={(value) => setMatch(value as typeof match)}
                options={[
                  ['any', 'Any of'],
                  ['all', 'All of'],
                  ['count', 'At least N'],
                ]}
              />
              {match === 'count'
                ? field('Number selected', count, setCount)
                : categoryChoices('Include', ids, (id) => chooseCategory(id))}
              <View style={styles.divider} />
              <Disclosure
                label="Exclude categories"
                detail={excludedLabels || undefined}
                expanded={exclusionsOpen}
                onPress={() => setExclusionsOpen((previous) => !previous)}
              >
                {categoryChoices('Must not include', exclude, (id) =>
                  chooseCategory(id, true),
                )}
              </Disclosure>
              {habit.categories?.some(
                (option) =>
                  option.archived &&
                  (ids.includes(option.id) || exclude.includes(option.id)),
              ) && (
                <Text style={styles.note}>
                  An archived category is part of this goal.
                </Text>
              )}
            </Animated.View>
          )}
          {kind === 'text' && (
            <Animated.View entering={appear} style={styles.stack}>
              <Choices
                label="Match text"
                colour={habit.color}
                value={match}
                onChange={(value) => setMatch(value as typeof match)}
                options={[
                  ['any', 'Any phrase'],
                  ['all', 'All phrases'],
                ]}
              />
              {field('Phrases · one per line', terms, setTerms, false)}
              <Text style={styles.note}>Ignores case and extra spaces.</Text>
            </Animated.View>
          )}
        </View>
        <View style={styles.card}>
          <View style={styles.inline}>
            <Text style={[styles.label, { flex: 1 }]}>Repeat</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select every day"
              onPress={() => setWeekdays([...allWeekdays])}
              style={styles.smallAction}
            >
              <Text
                style={[
                  styles.note,
                  { color: weekdays.length === 7 ? habit.color : '#AAAAAA' },
                ]}
              >
                Every day
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select weekdays"
              onPress={() => setWeekdays([1, 2, 3, 4, 5])}
              style={styles.smallAction}
            >
              <Text style={styles.note}>Weekdays</Text>
            </Pressable>
          </View>
          <View style={styles.days}>
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <Pressable
                key={day}
                accessibilityRole="checkbox"
                accessibilityLabel={`Applies on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day]}`}
                accessibilityState={{ checked: weekdays.includes(day) }}
                aria-checked={weekdays.includes(day)}
                onPress={() =>
                  setWeekdays((previous) =>
                    previous.includes(day)
                      ? previous.filter((item) => item !== day)
                      : [...previous, day],
                  )
                }
                style={({ pressed }) => [
                  styles.day,
                  {
                    backgroundColor: weekdays.includes(day)
                      ? colorOnBlack(habit.color, 0.18)
                      : '#222222',
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.control,
                    { color: weekdays.includes(day) ? habit.color : '#888888' },
                  ]}
                >
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'][day]}
                </Text>
              </Pressable>
            ))}
          </View>
          {kind === 'none' && (
            <Text style={styles.note}>
              This schedule is kept for when you set a completion goal.
            </Text>
          )}
          <View style={styles.divider} />
          <StartDateField
            label="Apply from"
            help=""
            value={from}
            onChange={setFrom}
            colour={habit.color}
          />
          {from < today && (
            <Text style={styles.note}>
              Earlier results in this period will be updated.
            </Text>
          )}
        </View>
        {!!issue && (
          <Text accessibilityRole="alert" style={styles.error}>
            {issue}
          </Text>
        )}
        {kind !== 'none' && (
          <View style={styles.card}>
            <Disclosure
              label="Try a value"
              expanded={tryOpen}
              onPress={() => setTryOpen((previous) => !previous)}
            >
              {type === 'categorical' ? (
                categoryChoices('Test selections', testIds, (id) =>
                  setTestIds((previous) => toggle(previous, id)),
                )
              ) : type === 'checkbox' ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel="Test checkbox completion"
                  accessibilityState={{ checked: testText === '1' }}
                  aria-checked={testText === '1'}
                  onPress={() =>
                    setTestText((previous) => (previous === '1' ? '' : '1'))
                  }
                  style={({ pressed }) => [
                    styles.testCheckbox,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Icon
                    name={testText === '1' ? 'checked' : 'unchecked'}
                    size={27}
                    color={habit.color}
                  />
                  <Text style={styles.control}>
                    {testText === '1' ? 'Checked' : 'Tap to check'}
                  </Text>
                </Pressable>
              ) : (
                field('Test value', testText, setTestText, type === 'number')
              )}
              <View
                accessibilityLiveRegion="polite"
                style={[
                  styles.result,
                  {
                    backgroundColor: testMet
                      ? colorOnBlack(habit.color, 0.12)
                      : '#202020',
                  },
                ]}
              >
                <Icon
                  name={testMet ? 'checked' : 'unchecked'}
                  size={18}
                  color={testMet ? habit.color : '#999999'}
                />
                <Text
                  style={[
                    styles.control,
                    { color: testMet ? habit.color : '#AAAAAA' },
                  ]}
                >
                  {!valid
                    ? 'Finish the condition above'
                    : testMet
                      ? 'Goal met'
                      : 'Goal not met'}
                </Text>
              </View>
            </Disclosure>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open goal timeline"
          onPress={onTimeline}
          style={({ pressed }) => [
            styles.timelineButton,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <Icon name="history" size={20} color="#AAAAAA" />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.control}>Goal timeline</Text>
            <Text style={styles.note}>
              {habit.goals?.length
                ? 'Earlier and scheduled goals'
                : 'Your goal changes will appear here'}
            </Text>
          </View>
          <View style={{ transform: [{ rotate: '-90deg' }] }}>
            <Icon name="chevron" size={16} color="#777777" />
          </View>
        </Pressable>
        {existing && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove goal version"
            disabled={!editable}
            onPress={onRemove}
            style={styles.action}
          >
            <Text style={styles.destructive}>Remove this goal</Text>
          </Pressable>
        )}
        <InfoNote
          label="How goal changes work"
          text="New goals start on the selected date and preserve earlier goals. Editing an earlier goal changes results only until the next goal starts. Recorded values stay saved. All applied changes can be undone in History."
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
    minHeight: 56,
  },
  title: { fontSize: 17, color: '#E5E5E5', fontWeight: '600', flexShrink: 1 },
  action: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  smallAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  control: { color: '#DADADA', fontSize: 14 },
  body: {
    padding: 16,
    paddingTop: 10,
    paddingBottom: 32,
    gap: 12,
    maxWidth: 660,
    width: '100%',
    alignSelf: 'center',
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  habit: { fontSize: 16, fontWeight: '500', flexShrink: 1 },
  card: { backgroundColor: '#161616', borderRadius: 16, padding: 14, gap: 12 },
  group: { gap: 8 },
  stack: { gap: 14 },
  label: { color: '#999999', fontSize: 12 },
  note: { color: '#999999', fontSize: 12, lineHeight: 17 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 11,
    borderRadius: 10,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  day: {
    minWidth: 44,
    minHeight: 44,
    flexGrow: 1,
    padding: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#2A2A2A' },
  disclosure: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    minHeight: 44,
    color: '#EEEEEE',
    fontSize: 17,
    padding: 12,
    backgroundColor: '#242424',
    borderRadius: 10,
  },
  testCheckbox: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: '#242424',
    borderRadius: 10,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  timelineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#EBAE9F',
    paddingHorizontal: 4,
  },
  destructive: { fontSize: 14, color: '#D99090' },
});
