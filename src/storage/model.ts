import { validGoalTimeline } from '../habitGoals.ts';
import {
  entryLabel,
  sameEntry,
  validEntryText,
  MAX_CATEGORIES,
  MAX_CATEGORY_LABEL,
  MAX_CATEGORY_SHORT_LABEL,
  type EntryValue,
  type EntryValues,
} from '../entries.ts';
import { isTextScale } from '../textSize.ts';
import { validDescription } from '../description.ts';
import {
  displayDefaults,
  isCheckboxStyle,
  type CheckboxStyle,
  isColumnSpacing,
  isNameColumnWidth,
  effectiveColumnSpacing,
  type NameColumnWidth,
  isWeekStart,
  type ColumnSpacing,
  type WeekStart,
} from '../displayPreferences.ts';
import { isRowSpacing, type RowSpacing } from '../rowSpacing.ts';
import { isHabitIcon } from '../habitIcons.ts';
import { habitType, isNumericHabit, type Habit } from '../habits.ts';

export type StoredState = {
  habits: Habit[];
  values: EntryValues;
  hapticsEnabled: boolean;
  rowSpacing?: RowSpacing;
  columnSpacing?: ColumnSpacing;
  columnDensity?: ColumnSpacing;
  nameColumnWidth?: NameColumnWidth;
  weekStart?: WeekStart;
  dateFading?: boolean;
  checkboxStyle?: CheckboxStyle;
  weekDividers?: boolean;
  tapAnimations?: boolean;
  textScale?: number;
  hideCompleted?: boolean;
};
export type DeletedHabit = {
  habit: Habit;
  entries: Record<string, EntryValue>;
};
export type Change =
  | {
      kind: 'entry';
      habitId: string;
      date: string;
      before: EntryValue | null;
      after: EntryValue | null;
    }
  | { kind: 'colour'; habitId: string; before: string; after: string }
  | {
      kind: 'habit';
      habitId: string;
      index: number;
      before: Habit | null;
      after: Habit | null;
    }
  | {
      kind: 'deleteHabit';
      habitId: string;
      index: number;
      before: DeletedHabit | null;
      after: DeletedHabit | null;
    }
  | { kind: 'order'; before: string[]; after: string[] }
  | { kind: 'haptics'; before: boolean; after: boolean }
  | { kind: 'rowSpacing'; before: RowSpacing; after: RowSpacing }
  | { kind: 'columnSpacing'; before: ColumnSpacing; after: ColumnSpacing }
  | { kind: 'columnDensity'; before: ColumnSpacing; after: ColumnSpacing }
  | { kind: 'nameColumnWidth'; before: NameColumnWidth; after: NameColumnWidth }
  | { kind: 'weekStart'; before: WeekStart; after: WeekStart }
  | { kind: 'weekDividers'; before: boolean; after: boolean }
  | { kind: 'tapAnimations'; before: boolean; after: boolean }
  | { kind: 'checkboxStyle'; before: CheckboxStyle; after: CheckboxStyle }
  | { kind: 'dateFading'; before: boolean; after: boolean }
  | { kind: 'textScale'; before: number; after: number }
  | { kind: 'hideCompleted'; before: boolean; after: boolean };
export type PreferenceChange = Extract<
  Change,
  {
    kind:
      | 'haptics'
      | 'rowSpacing'
      | 'columnSpacing'
      | 'columnDensity'
      | 'nameColumnWidth'
      | 'weekStart'
      | 'weekDividers'
      | 'tapAnimations'
      | 'checkboxStyle'
      | 'dateFading'
      | 'textScale'
      | 'hideCompleted';
  }
>;
export function isPreference(change: Change): change is PreferenceChange {
  return (
    change.kind === 'haptics' ||
    change.kind === 'rowSpacing' ||
    change.kind === 'columnSpacing' ||
    change.kind === 'columnDensity' ||
    change.kind === 'nameColumnWidth' ||
    change.kind === 'weekStart' ||
    change.kind === 'weekDividers' ||
    change.kind === 'tapAnimations' ||
    change.kind === 'checkboxStyle' ||
    change.kind === 'dateFading' ||
    change.kind === 'textScale' ||
    change.kind === 'hideCompleted'
  );
}
export type HabitChange = Exclude<Change, PreferenceChange>;
export type EventMeta = {
  version:
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
  id: string;
  sequence: number;
  recordedAt: string;
  timeZone: string;
  utcOffsetMinutes: number;
};
export type LegacyChangeEvent = EventMeta & { version: 1 } & (
    | { type: 'change'; change: Change }
    | { type: 'undo' | 'redo'; targetId: string; change: Change }
  );
export type CurrentChangeEvent = EventMeta & {
  version:
    2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;
} & (
    | { type: 'change'; groupId: string; change: HabitChange }
    | { type: 'undo' | 'redo'; targetId: string; change: HabitChange }
    | { type: 'preference'; change: PreferenceChange }
  );
export type ChangeEvent = LegacyChangeEvent | CurrentChangeEvent;
export type StoredEvent =
  (EventMeta & { type: 'initialize'; habits: Habit[] }) | ChangeEvent;
export type HistoryAction = EventMeta & {
  type: 'change';
  change: HabitChange;
  firstRecordedAt: string;
  firstSequence: number;
  editCount: number;
  lastChangedSequence: number;
};
export type RedoAction = { action: HistoryAction; undoId: string };
export type Replay = {
  state: StoredState;
  undo: HistoryAction[];
  redo: RedoAction[];
  lastGroup: HistoryAction | null;
  legacyUndo: LegacyChangeEvent[];
  legacyRedo: LegacyChangeEvent[];
  hasV2: boolean;
  hasV3: boolean;
  hasV4: boolean;
  hasV5: boolean;
  hasV6: boolean;
  hasV7: boolean;
  hasV8: boolean;
  hasV9: boolean;
  hasV10: boolean;
  hasV11: boolean;
  hasV12: boolean;
  hasV13: boolean;
  hasV14: boolean;
  hasV15: boolean;
  hasV16: boolean;
  hasV17: boolean;
};
export const emptyReplay = (): Replay => ({
  state: { habits: [], values: {}, hapticsEnabled: true },
  undo: [],
  redo: [],
  lastGroup: null,
  legacyUndo: [],
  legacyRedo: [],
  hasV2: false,
  hasV3: false,
  hasV4: false,
  hasV5: false,
  hasV6: false,
  hasV7: false,
  hasV8: false,
  hasV9: false,
  hasV10: false,
  hasV11: false,
  hasV12: false,
  hasV13: false,
  hasV14: false,
  hasV15: false,
  hasV16: false,
  hasV17: false,
});
export const GROUP_INACTIVITY_MS = 2 * 60 * 1000;

function insist(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function object(value: unknown): asserts value is Record<string, unknown> {
  insist(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    'Expected an object.',
  );
}
function keys(value: Record<string, unknown>, expected: string[]) {
  insist(
    Object.keys(value).length === expected.length &&
      expected.every((key) => Object.hasOwn(value, key)),
    'Unrecognized or missing fields.',
  );
}
function id(value: unknown): asserts value is string {
  insist(
    typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value),
    'Invalid identifier.',
  );
}
function colour(value: unknown): asserts value is string {
  insist(
    typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value),
    'Invalid colour.',
  );
}
export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
function amount(value: unknown): asserts value is number | null {
  insist(
    value === null ||
      (typeof value === 'number' &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= Number.MAX_SAFE_INTEGER),
    'Invalid daily value.',
  );
}
export function sameValue(left: unknown, right: unknown): boolean {
  if (left === right) return true;
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object')
    return false;
  const a = left as Record<string, unknown>,
    b = right as Record<string, unknown>;
  return (
    Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every(
      (key) => Object.hasOwn(b, key) && sameValue(a[key], b[key]),
    )
  );
}
function validateHabit(
  value: unknown,
  version: number,
): asserts value is Habit {
  object(value);
  keys(value, [
    'id',
    'name',
    'color',
    ...[
      'unit',
      ...(version >= 3 ? ['type', 'archived'] : []),
      ...(version >= 4 ? ['icon'] : []),
      ...(version >= 5 ? ['startDate'] : []),
      ...(version >= 7 ? ['description'] : []),
      ...(version >= 10 ? ['categories'] : []),
      ...(version >= 11 ? ['goals'] : []),
    ].filter((key) => Object.hasOwn(value, key)),
  ]);
  id(value.id);
  if (Object.hasOwn(value, 'goals'))
    insist(
      validGoalTimeline(
        value.goals,
        value as Habit,
        version >= 13,
        version >= 14,
      ),
      'Invalid goal timeline or rule.',
    );
  colour(value.color);
  insist(
    typeof value.name === 'string' &&
      value.name.trim().length > 0 &&
      value.name.length <= 200,
    'Invalid habit name.',
  );
  if (Object.hasOwn(value, 'unit'))
    insist(
      typeof value.unit === 'string' &&
        value.unit.trim().length > 0 &&
        value.unit.length <= 80,
      'Invalid unit.',
    );
  if (Object.hasOwn(value, 'type'))
    insist(
      value.type === 'checkbox' ||
        value.type === 'number' ||
        (version >= 10 &&
          (value.type === 'categorical' || value.type === 'text')),
      'Invalid habit type.',
    );
  if (Object.hasOwn(value, 'description'))
    insist(validDescription(value.description), 'Invalid habit description.');
  if (Object.hasOwn(value, 'startDate'))
    insist(validDate(value.startDate), 'Invalid habit start date.');
  if (Object.hasOwn(value, 'icon'))
    insist(isHabitIcon(value.icon), 'Invalid habit icon.');
  if (Object.hasOwn(value, 'archived'))
    insist(typeof value.archived === 'boolean', 'Invalid archived state.');
  insist(
    !value.unit || habitType(value as Habit) === 'number',
    'Only numeric habits can have a unit.',
  );
  if (Object.hasOwn(value, 'categories')) {
    insist(
      value.type === 'categorical',
      'Only categorical habits have categories.',
    );
    insist(
      Array.isArray(value.categories) &&
        value.categories.length > 0 &&
        value.categories.length <= MAX_CATEGORIES,
      'Invalid categories.',
    );
    const ids = new Set<string>();
    for (const option of value.categories) {
      object(option);
      keys(option, [
        'id',
        'label',
        ...['shortLabel', 'archived'].filter((key) =>
          Object.hasOwn(option, key),
        ),
      ]);
      id(option.id);
      insist(!ids.has(option.id), 'Repeated category identifier.');
      ids.add(option.id);
      insist(
        typeof option.label === 'string' &&
          option.label.trim().length > 0 &&
          option.label.length <= MAX_CATEGORY_LABEL,
        'Invalid category label.',
      );
      if (Object.hasOwn(option, 'shortLabel'))
        insist(
          typeof option.shortLabel === 'string' &&
            option.shortLabel.trim().length > 0 &&
            option.shortLabel.length <= MAX_CATEGORY_SHORT_LABEL,
          'Invalid short category label.',
        );
      if (Object.hasOwn(option, 'archived'))
        insist(
          typeof option.archived === 'boolean',
          'Invalid archived category.',
        );
    }
    insist(
      value.categories.some((option) => !option.archived),
      'Keep at least one active category.',
    );
  }
  insist(
    value.type !== 'categorical' || Object.hasOwn(value, 'categories'),
    'Categorical habits need categories.',
  );
}
function dailyValue(value: unknown, version: number) {
  if (version < 10 || value === null || typeof value === 'number')
    return amount(value);
  if (typeof value === 'string')
    return insist(validEntryText(value), 'Invalid text entry.');
  insist(
    Array.isArray(value) && value.length > 0 && value.length <= MAX_CATEGORIES,
    'Invalid category selection.',
  );
  for (const item of value) id(item);
  insist(
    new Set(value).size === value.length &&
      value.every((item, index) => index === 0 || value[index - 1] < item),
    'Category selections must be unique and sorted.',
  );
}
function entryFits(habit: Habit, value: EntryValue | null, version = 17) {
  if (value === null) return true;
  switch (habitType(habit)) {
    case 'checkbox':
      return value === 1 || (version >= 14 && value === 0);
    case 'number':
      return typeof value === 'number';
    case 'text':
      return typeof value === 'string';
    case 'categorical':
      return (
        Array.isArray(value) &&
        value.every((id) =>
          habit.categories?.some((option) => option.id === id),
        )
      );
  }
}
export function validateChange(
  value: unknown,
  version = 17,
): asserts value is Change {
  object(value);
  if (value.kind === 'entry') {
    keys(value, ['kind', 'habitId', 'date', 'before', 'after']);
    id(value.habitId);
    insist(validDate(value.date), 'Invalid calendar date.');
    dailyValue(value.before, version);
    dailyValue(value.after, version);
  } else if (value.kind === 'colour') {
    keys(value, ['kind', 'habitId', 'before', 'after']);
    id(value.habitId);
    colour(value.before);
    colour(value.after);
  } else if (value.kind === 'habit') {
    keys(value, ['kind', 'habitId', 'index', 'before', 'after']);
    id(value.habitId);
    insist(
      Number.isSafeInteger(value.index) && Number(value.index) >= 0,
      'Invalid habit position.',
    );
    insist(
      value.before !== null || value.after !== null,
      'Missing habit definition.',
    );
    for (const habit of [value.before, value.after])
      if (habit !== null) {
        validateHabit(habit, version);
        insist(habit.id === value.habitId, 'Habit identity cannot change.');
      }
  } else if (value.kind === 'deleteHabit') {
    insist(version >= 12, 'Habit deletion requires version 12.');
    keys(value, ['kind', 'habitId', 'index', 'before', 'after']);
    id(value.habitId);
    insist(
      Number.isSafeInteger(value.index) && Number(value.index) >= 0,
      'Invalid habit position.',
    );
    insist(
      (value.before === null) !== (value.after === null),
      'Deletion needs exactly one habit snapshot.',
    );
    const snapshot = value.before ?? value.after;
    object(snapshot);
    keys(snapshot, ['habit', 'entries']);
    validateHabit(snapshot.habit, version);
    insist(
      snapshot.habit.id === value.habitId && snapshot.habit.archived === true,
      'Only archived habits can be deleted.',
    );
    object(snapshot.entries);
    for (const [date, entry] of Object.entries(snapshot.entries)) {
      insist(validDate(date), 'Invalid calendar date.');
      dailyValue(entry, version);
      insist(
        entry !== null &&
          entryFits(snapshot.habit, entry as EntryValue, version),
        'Invalid deleted habit entry.',
      );
    }
  } else if (value.kind === 'order') {
    keys(value, ['kind', 'before', 'after']);
    for (const order of [value.before, value.after]) {
      insist(
        Array.isArray(order) && order.length <= 1000,
        'Invalid habit order.',
      );
      order.forEach(id);
      insist(new Set(order).size === order.length, 'Repeated habit in order.');
    }
  } else if (
    value.kind === 'columnSpacing' ||
    value.kind === 'weekStart' ||
    value.kind === 'dateFading'
  ) {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 6, 'Display preferences require version 6.');
    const valid =
      value.kind === 'columnSpacing'
        ? isColumnSpacing
        : value.kind === 'weekStart'
          ? isWeekStart
          : (item: unknown) => typeof item === 'boolean';
    insist(
      valid(value.before) && valid(value.after),
      'Invalid display preference.',
    );
  } else if (value.kind === 'columnDensity') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 17, 'Revised column spacing requires version 17.');
    insist(
      isColumnSpacing(value.before) && isColumnSpacing(value.after),
      'Invalid revised column spacing.',
    );
  } else if (value.kind === 'nameColumnWidth') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 17, 'Name column width requires version 17.');
    insist(
      isNameColumnWidth(value.before) && isNameColumnWidth(value.after),
      'Invalid name column width.',
    );
  } else if (value.kind === 'weekDividers' || value.kind === 'tapAnimations') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 16, 'Grid appearance toggles require version 16.');
    insist(
      typeof value.before === 'boolean' && typeof value.after === 'boolean',
      'Invalid grid appearance toggle.',
    );
  } else if (value.kind === 'checkboxStyle') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 15, 'Checkbox style requires version 15.');
    insist(
      isCheckboxStyle(value.before) && isCheckboxStyle(value.after),
      'Invalid checkbox style.',
    );
  } else if (value.kind === 'hideCompleted') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 9, 'Completed visibility requires version 9.');
    insist(
      typeof value.before === 'boolean' && typeof value.after === 'boolean',
      'Invalid completed visibility.',
    );
  } else if (value.kind === 'textScale') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 8, 'Text size requires version 8.');
    insist(
      isTextScale(value.before) && isTextScale(value.after),
      'Invalid text size.',
    );
  } else if (value.kind === 'rowSpacing') {
    keys(value, ['kind', 'before', 'after']);
    insist(version >= 5, 'Row spacing requires version 5.');
    insist(
      isRowSpacing(value.before) && isRowSpacing(value.after),
      'Invalid row spacing.',
    );
  } else if (value.kind === 'haptics') {
    keys(value, ['kind', 'before', 'after']);
    insist(
      typeof value.before === 'boolean' && typeof value.after === 'boolean',
      'Invalid preference.',
    );
  } else throw new Error('Unsupported change type.');
  insist(
    !sameValue(value.before, value.after),
    'A change must change a value.',
  );
}
export function validateEvent(value: unknown): asserts value is StoredEvent {
  object(value);
  const common = [
    'version',
    'id',
    'sequence',
    'recordedAt',
    'timeZone',
    'utcOffsetMinutes',
    'type',
  ];
  insist(
    value.version === 1 ||
      value.version === 2 ||
      value.version === 3 ||
      value.version === 4 ||
      value.version === 5 ||
      value.version === 6 ||
      value.version === 7 ||
      value.version === 8 ||
      value.version === 9 ||
      value.version === 10 ||
      value.version === 11 ||
      value.version === 12 ||
      value.version === 13 ||
      value.version === 14 ||
      value.version === 15 ||
      value.version === 16 ||
      value.version === 17,
    'Unsupported event version.',
  );
  id(value.id);
  insist(
    Number.isSafeInteger(value.sequence) && Number(value.sequence) > 0,
    'Invalid sequence.',
  );
  insist(
    typeof value.recordedAt === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.recordedAt) &&
      new Date(value.recordedAt).toISOString() === value.recordedAt,
    'Invalid edit timestamp.',
  );
  insist(
    typeof value.timeZone === 'string' &&
      value.timeZone.length > 0 &&
      value.timeZone.length <= 100,
    'Invalid time zone.',
  );
  insist(
    Number.isInteger(value.utcOffsetMinutes) &&
      Math.abs(Number(value.utcOffsetMinutes)) <= 840,
    'Invalid UTC offset.',
  );
  if (value.type === 'initialize') {
    keys(value, [...common, 'habits']);
    insist(
      Array.isArray(value.habits) &&
        (value.habits.length > 0 || value.version >= 3) &&
        value.habits.length <= 1000,
      'Invalid initial habits.',
    );
    const ids = new Set<string>();
    for (const habit of value.habits) {
      validateHabit(habit, value.version);
      insist(!ids.has(habit.id), 'Duplicate habit identifier.');
      ids.add(habit.id);
    }
  } else if (
    value.type === 'change' ||
    value.type === 'undo' ||
    value.type === 'redo' ||
    (value.version !== 1 && value.type === 'preference')
  ) {
    const grouped = value.version !== 1 && value.type === 'change';
    keys(value, [
      ...common,
      'change',
      ...(value.type === 'undo' || value.type === 'redo' ? ['targetId'] : []),
      ...(grouped ? ['groupId'] : []),
    ]);
    validateChange(value.change, value.version);
    insist(
      value.version >= 3 ||
        (value.change.kind !== 'habit' && value.change.kind !== 'order'),
      'Habit management requires version 3.',
    );
    if (value.type === 'undo' || value.type === 'redo') id(value.targetId);
    if (grouped) id(value.groupId);
    if (value.version !== 1)
      insist(
        value.type === 'preference'
          ? isPreference(value.change)
          : !isPreference(value.change),
        'Preferences cannot be habit actions.',
      );
  } else throw new Error('Unsupported event type.');
}

export function inverse(change: Change): Change {
  return { ...change, before: change.after, after: change.before } as Change;
}
function sameChange(left: Change, right: Change): boolean {
  if (left.kind === 'order')
    return (
      right.kind === 'order' &&
      sameValue(left.before, right.before) &&
      sameValue(left.after, right.after)
    );
  if (left.kind === 'habit' || left.kind === 'deleteHabit')
    return (
      right.kind === left.kind &&
      left.habitId === right.habitId &&
      left.index === right.index &&
      sameValue(left.before, right.before) &&
      sameValue(left.after, right.after)
    );
  return (
    left.kind === right.kind &&
    sameValue(left.before, right.before) &&
    sameValue(left.after, right.after) &&
    (isPreference(left) ||
      (!isPreference(right) && left.habitId === right.habitId)) &&
    (left.kind !== 'entry' ||
      (right.kind === 'entry' && left.date === right.date))
  );
}
export function applyEvent(previous: Replay, event: StoredEvent): Replay {
  return reduceEvent(previous, event, false);
}
function sameField(left: Change, right: Change) {
  if (
    left.kind === 'deleteHabit' ||
    left.kind === 'habit' ||
    left.kind === 'order' ||
    right.kind === 'deleteHabit' ||
    right.kind === 'habit' ||
    right.kind === 'order'
  )
    return false;
  return (
    left.kind === right.kind &&
    (isPreference(left) ||
      (!isPreference(right) && left.habitId === right.habitId)) &&
    (left.kind !== 'entry' ||
      (right.kind === 'entry' && left.date === right.date))
  );
}
function editDay(meta: EventMeta): string {
  return new Date(Date.parse(meta.recordedAt) + meta.utcOffsetMinutes * 60000)
    .toISOString()
    .slice(0, 10);
}
export function canCoalesce(
  group: HistoryAction | null,
  meta: EventMeta,
  change: HabitChange,
): boolean {
  if (
    !group ||
    change.kind === 'habit' ||
    change.kind === 'deleteHabit' ||
    change.kind === 'order'
  )
    return false;
  const elapsed = Date.parse(meta.recordedAt) - Date.parse(group.recordedAt);
  return (
    sameField(group.change, change) &&
    sameValue(group.change.after, change.before) &&
    elapsed >= 0 &&
    elapsed < GROUP_INACTIVITY_MS &&
    group.timeZone === meta.timeZone &&
    group.utcOffsetMinutes === meta.utcOffsetMinutes &&
    editDay(group) === editDay(meta)
  );
}
function actionFrom(event: EventMeta, change: HabitChange): HistoryAction {
  return {
    ...event,
    type: 'change',
    change,
    firstRecordedAt: event.recordedAt,
    firstSequence: event.sequence,
    editCount: 1,
    lastChangedSequence: event.sequence,
  };
}
// Replay owns its fresh state; live reductions preserve previous snapshots.
function reduceEvent(
  previous: Replay,
  event: StoredEvent,
  mutable: boolean,
): Replay {
  validateEvent(event);
  if (event.type === 'initialize') {
    insist(
      event.sequence === 1 &&
        !previous.hasV2 &&
        previous.state.habits.length === 0,
      'Initialization must be first and unique.',
    );
    return {
      ...emptyReplay(),
      state: {
        habits: event.habits.map((habit) => ({ ...habit })),
        values: {},
        hapticsEnabled: true,
      },
      hasV2: event.version !== 1,
      hasV3: event.version >= 3,
      hasV4: event.version >= 4,
      hasV5: event.version >= 5,
      hasV6: event.version >= 6,
      hasV7: event.version >= 7,
      hasV8: event.version >= 8,
      hasV9: event.version >= 9,
      hasV10: event.version >= 10,
      hasV11: event.version >= 11,
      hasV12: event.version >= 12,
      hasV13: event.version >= 13,
      hasV14: event.version >= 14,
      hasV15: event.version >= 15,
      hasV16: event.version >= 16,
      hasV17: event.version >= 17,
    };
  }
  insist(
    previous.hasV2 || previous.state.habits.length > 0,
    'Missing initialization.',
  );
  insist(
    !previous.hasV2 || event.version !== 1,
    'Legacy events cannot follow version-2 events.',
  );
  insist(
    !previous.hasV3 || event.version >= 3,
    'Older events cannot follow version-3 events.',
  );
  insist(
    !previous.hasV4 || event.version >= 4,
    'Older events cannot follow version-4 events.',
  );
  insist(
    !previous.hasV5 || event.version >= 5,
    'Older events cannot follow version-5 events.',
  );
  insist(
    !previous.hasV6 || event.version >= 6,
    'Older events cannot follow version-6 events.',
  );
  insist(
    !previous.hasV7 || event.version >= 7,
    'Older events cannot follow version-7 events.',
  );
  insist(
    !previous.hasV8 || event.version >= 8,
    'Older events cannot follow version-8 events.',
  );
  insist(
    !previous.hasV9 || event.version >= 9,
    'Older events cannot follow version-9 events.',
  );
  insist(
    !previous.hasV10 || event.version >= 10,
    'Older events cannot follow version-10 events.',
  );
  insist(
    !previous.hasV11 || event.version >= 11,
    'Older events cannot follow version-11 events.',
  );
  insist(
    !previous.hasV17 || event.version >= 17,
    'Older events cannot follow version-17 events.',
  );
  insist(
    !previous.hasV16 || event.version >= 16,
    'Older events cannot follow version-16 events.',
  );
  insist(
    !previous.hasV15 || event.version >= 15,
    'Older events cannot follow version-15 events.',
  );
  insist(
    !previous.hasV14 || event.version >= 14,
    'Older events cannot follow version-14 events.',
  );
  insist(
    !previous.hasV13 || event.version >= 13,
    'Older events cannot follow version-13 events.',
  );
  insist(
    !previous.hasV12 || event.version >= 12,
    'Older events cannot follow version-12 events.',
  );
  const undo = mutable ? previous.undo : [...previous.undo];
  const redo = mutable ? previous.redo : [...previous.redo];
  let legacyUndo = mutable ? previous.legacyUndo : [...previous.legacyUndo];
  let legacyRedo = mutable ? previous.legacyRedo : [...previous.legacyRedo];
  let lastGroup = previous.lastGroup;
  if (event.version === 1) {
    // Interpret historical v1 undo exactly as written, including old preferences.
    if (event.type === 'undo') {
      const target = legacyUndo.at(-1);
      insist(
        target &&
          target.id === event.targetId &&
          sameChange(event.change, inverse(target.change)),
        'Invalid legacy undo target or inverse.',
      );
      legacyUndo.pop();
      legacyRedo.push(event);
      if (!isPreference(event.change)) {
        const action = undo.at(-1);
        insist(
          action && action.id === event.targetId,
          'Invalid habit undo target.',
        );
        undo.pop();
        redo.push({ action, undoId: event.id });
      }
    } else if (event.type === 'redo') {
      const target = legacyRedo.at(-1);
      insist(
        target &&
          target.id === event.targetId &&
          sameChange(event.change, inverse(target.change)),
        'Invalid legacy redo target or inverse.',
      );
      legacyRedo.pop();
      legacyUndo.push(event);
      if (!isPreference(event.change)) {
        const targetAction = redo.at(-1);
        insist(
          targetAction && targetAction.undoId === event.targetId,
          'Invalid habit redo target.',
        );
        redo.pop();
        // v1 used the redo event ID as the next undo target. Keep that identity.
        undo.push({
          ...targetAction.action,
          id: event.id,
          lastChangedSequence: event.sequence,
        });
      }
    } else {
      legacyUndo.push(event);
      legacyRedo.length = 0;
      // Old preference edits also abandoned the redo branch. Respect that
      // recorded v1 behaviour; only new v2 preferences preserve habit redo.
      redo.length = 0;
      if (!isPreference(event.change)) {
        undo.push(actionFrom(event, event.change));
      }
    }
    lastGroup = null;
  } else {
    legacyUndo = [];
    legacyRedo = [];
    if (event.type === 'change') {
      let action: HistoryAction;
      if (event.groupId === event.id) action = actionFrom(event, event.change);
      else {
        insist(
          lastGroup &&
            lastGroup.id === event.groupId &&
            canCoalesce(lastGroup, event, event.change),
          'Invalid edit group or inactivity window.',
        );
        if (!sameValue(lastGroup.change.before, lastGroup.change.after)) {
          insist(
            undo.at(-1)?.id === lastGroup.id,
            'Group is no longer the latest action.',
          );
          undo.pop();
        }
        action = {
          ...lastGroup,
          recordedAt: event.recordedAt,
          sequence: event.sequence,
          change: {
            ...event.change,
            before: lastGroup.change.before,
          } as HabitChange,
          editCount: lastGroup.editCount + 1,
          lastChangedSequence: event.sequence,
        };
      }
      if (!sameValue(action.change.before, action.change.after))
        undo.push(action);
      redo.length = 0;
      lastGroup =
        action.change.kind === 'habit' ||
        action.change.kind === 'deleteHabit' ||
        action.change.kind === 'order'
          ? null
          : action;
    } else if (event.type === 'undo') {
      const target = undo.at(-1);
      insist(
        target &&
          target.id === event.targetId &&
          sameChange(event.change, inverse(target.change)),
        'Invalid grouped undo target or inverse.',
      );
      undo.pop();
      redo.push({ action: target, undoId: event.id });
      lastGroup = null;
    } else if (event.type === 'redo') {
      const target = redo.at(-1);
      insist(
        target &&
          target.undoId === event.targetId &&
          sameChange(event.change, target.action.change),
        'Invalid grouped redo target or change.',
      );
      redo.pop();
      undo.push({ ...target.action, lastChangedSequence: event.sequence });
      lastGroup = null;
    }
    // Preferences only update saved state. They leave habit undo/redo/groups intact.
  }
  return {
    state: reduceChange(previous.state, event.change, mutable, event.version),
    undo,
    redo,
    lastGroup,
    legacyUndo,
    legacyRedo,
    hasV2: previous.hasV2 || event.version !== 1,
    hasV3: previous.hasV3 || event.version >= 3,
    hasV4: previous.hasV4 || event.version >= 4,
    hasV5: previous.hasV5 || event.version >= 5,
    hasV6: previous.hasV6 || event.version >= 6,
    hasV7: previous.hasV7 || event.version >= 7,
    hasV8: previous.hasV8 || event.version >= 8,
    hasV9: previous.hasV9 || event.version >= 9,
    hasV10: previous.hasV10 || event.version >= 10,
    hasV11: previous.hasV11 || event.version >= 11,
    hasV12: previous.hasV12 || event.version >= 12,
    hasV13: previous.hasV13 || event.version >= 13,
    hasV14: previous.hasV14 || event.version >= 14,
    hasV15: previous.hasV15 || event.version >= 15,
    hasV16: previous.hasV16 || event.version >= 16,
    hasV17: previous.hasV17 || event.version >= 17,
  };
}
export function applyChange(state: StoredState, change: Change): StoredState {
  return reduceChange(state, change, false);
}
function reduceChange(
  state: StoredState,
  change: Change,
  mutable: boolean,
  version = 17,
): StoredState {
  validateChange(change, version);
  let next: StoredState;
  if (
    change.kind === 'columnSpacing' ||
    change.kind === 'columnDensity' ||
    change.kind === 'nameColumnWidth' ||
    change.kind === 'weekStart' ||
    change.kind === 'weekDividers' ||
    change.kind === 'tapAnimations' ||
    change.kind === 'checkboxStyle' ||
    change.kind === 'dateFading' ||
    change.kind === 'textScale' ||
    change.kind === 'hideCompleted'
  ) {
    insist(
      (change.kind === 'columnSpacing'
        ? (state.columnSpacing ?? 'compact')
        : change.kind === 'columnDensity'
          ? effectiveColumnSpacing(state)
          : (state[change.kind] ?? displayDefaults[change.kind])) ===
        change.before,
      'Preference precondition failed.',
    );
    next = { ...state, [change.kind]: change.after };
  } else if (change.kind === 'rowSpacing') {
    insist(
      (state.rowSpacing ?? 'standard') === change.before,
      'Preference precondition failed.',
    );
    if (mutable) {
      state.rowSpacing = change.after;
      next = state;
    } else next = { ...state, rowSpacing: change.after };
  } else if (change.kind === 'haptics') {
    insist(
      state.hapticsEnabled === change.before,
      'Preference precondition failed.',
    );
    if (mutable) {
      state.hapticsEnabled = change.after;
      next = state;
    } else next = { ...state, hapticsEnabled: change.after };
  } else if (change.kind === 'order') {
    const current = state.habits.map((habit) => habit.id);
    insist(
      sameValue(current, change.before) &&
        change.after.length === current.length &&
        change.after.every((id) => current.includes(id)),
      'Order precondition failed.',
    );
    const byId = new Map(state.habits.map((habit) => [habit.id, habit]));
    next = { ...state, habits: change.after.map((id) => byId.get(id)!) };
  } else if (change.kind === 'deleteHabit') {
    const prefix = `${change.habitId}:`;
    const entries = Object.fromEntries(
      Object.entries(state.values)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]),
    );
    const habits = [...state.habits];
    const values = { ...state.values };
    if (change.before) {
      insist(
        sameValue(habits[change.index], change.before.habit) &&
          sameValue(entries, change.before.entries),
        'Deleted habit precondition failed.',
      );
      habits.splice(change.index, 1);
      for (const date of Object.keys(entries))
        delete values[`${prefix}${date}`];
    } else {
      insist(
        change.index <= habits.length &&
          habits.length < 1000 &&
          !habits.some((habit) => habit.id === change.habitId) &&
          !Object.keys(entries).length,
        'Deleted habit restore precondition failed.',
      );
      habits.splice(change.index, 0, { ...change.after!.habit });
      for (const [date, entry] of Object.entries(change.after!.entries))
        values[`${prefix}${date}`] = entry;
    }
    next = { ...state, habits, values };
  } else if (change.kind === 'habit') {
    const current = state.habits[change.index] ?? null;
    if (change.before === null) {
      insist(
        change.index <= state.habits.length &&
          !state.habits.some((habit) => habit.id === change.habitId) &&
          state.habits.length < 1000,
        'Habit already exists or position is invalid.',
      );
    } else
      insist(sameValue(current, change.before), 'Habit precondition failed.');
    if (change.after === null)
      insist(
        !Object.keys(state.values).some((key) =>
          key.startsWith(`${change.habitId}:`),
        ),
        'Cannot remove a habit with entries.',
      );
    if (
      change.before &&
      change.after &&
      habitType(change.before) !== habitType(change.after)
    )
      insist(
        !Object.keys(state.values).some((key) =>
          key.startsWith(`${change.habitId}:`),
        ),
        'Cannot change type while entries exist.',
      );
    if (change.after) {
      const prefix = `${change.habitId}:`;
      insist(
        Object.entries(state.values).every(
          ([key, value]) =>
            !key.startsWith(prefix) || entryFits(change.after!, value, version),
        ),
        'Cannot remove categories referenced by entries; archive them instead.',
      );
    }
    const habits = [...state.habits];
    habits.splice(
      change.index,
      change.before === null ? 0 : 1,
      ...(change.after ? [{ ...change.after }] : []),
    );
    next = { ...state, habits };
  } else {
    const habit = state.habits.find((habit) => habit.id === change.habitId);
    insist(habit, 'Unknown habit.');
    if (change.kind === 'colour') {
      insist(habit.color === change.before, 'Colour precondition failed.');
      if (mutable) {
        habit.color = change.after;
        next = state;
      } else
        next = {
          ...state,
          habits: state.habits.map((habit) =>
            habit.id === change.habitId
              ? { ...habit, color: change.after }
              : habit,
          ),
        };
    } else {
      const key = `${change.habitId}:${change.date}`;
      insist(
        sameEntry(state.values[key] ?? null, change.before),
        'Daily value precondition failed.',
      );
      insist(
        [change.before, change.after].every((value) =>
          entryFits(habit, value, version),
        ),
        'Daily value does not match habit type or categories.',
      );
      const values = mutable ? state.values : { ...state.values };
      if (change.after === null) delete values[key];
      else values[key] = change.after;
      next = mutable ? state : { ...state, values };
    }
  }
  return next;
}
export function replayEvents(input: unknown): {
  events: StoredEvent[];
  replay: Replay;
} {
  insist(Array.isArray(input) && input.length > 0, 'Invalid change log size.');
  const ids = new Set<string>();
  let replay = emptyReplay();
  const events: StoredEvent[] = [];
  for (const candidate of input) {
    validateEvent(candidate);
    insist(
      candidate.sequence === events.length + 1,
      'Missing or reordered change.',
    );
    insist(!ids.has(candidate.id), 'Duplicate change identifier.');
    ids.add(candidate.id);
    replay = reduceEvent(replay, candidate, true);
    events.push(candidate);
  }
  return { events, replay };
}
export function describeChange(change: Change, state: StoredState): string {
  if (change.kind === 'nameColumnWidth') return 'Name column width';
  if (change.kind === 'columnDensity')
    return `Column spacing · ${change.after}`;
  if (change.kind === 'columnSpacing')
    return `Column spacing · ${change.after}`;
  if (change.kind === 'weekDividers')
    return `Week dividers ${change.after ? 'on' : 'off'}`;
  if (change.kind === 'tapAnimations')
    return `Tap animations ${change.after ? 'on' : 'off'}`;
  if (change.kind === 'checkboxStyle')
    return `Checkbox style · ${change.after === 'boxes' ? 'Checkboxes' : 'Ticks & crosses'}`;
  if (change.kind === 'weekStart') return `Week starts on ${change.after}`;
  if (change.kind === 'hideCompleted')
    return `Hide completed today ${change.after ? 'on' : 'off'}`;
  if (change.kind === 'textScale')
    return `Text size · ${Math.round(change.after * 100)}%`;
  if (change.kind === 'dateFading')
    return `Date fading ${change.after ? 'on' : 'off'}`;
  if (change.kind === 'rowSpacing') return `Row spacing · ${change.after}`;
  if (change.kind === 'order') return 'Habit order changed';
  if (change.kind === 'deleteHabit')
    return `${(change.before ?? change.after)!.habit.name} · ${change.after ? 'Deletion undone' : 'Deleted'}`;
  if (change.kind === 'habit')
    return `${change.after?.name ?? change.before?.name} · Habit changed`;
  if (change.kind === 'haptics')
    return `Haptics ${change.after ? 'on' : 'off'}`;
  const habit = state.habits.find((habit) => habit.id === change.habitId);
  const name = habit?.name ?? 'Habit';
  if (change.kind === 'colour') return `${name} · Colour changed`;
  const value =
    change.after === null
      ? 'Cleared'
      : habit && isNumericHabit(habit)
        ? `${change.after}${habit.unit ? ` ${habit.unit}` : ''}`
        : habit
          ? entryLabel(habit, change.after)
          : String(change.after);
  return `${name} · ${value}`;
}
