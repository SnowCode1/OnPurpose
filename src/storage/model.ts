import type { Habit } from '../habits.ts';

export type StoredState = {
  habits: Habit[];
  values: Record<string, number>;
  hapticsEnabled: boolean;
};
export type Change =
  | {
      kind: 'entry';
      habitId: string;
      date: string;
      before: number | null;
      after: number | null;
    }
  | { kind: 'colour'; habitId: string; before: string; after: string }
  | { kind: 'haptics'; before: boolean; after: boolean };
export type HabitChange = Exclude<Change, { kind: 'haptics' }>;
export type EventMeta = {
  version: 1 | 2;
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
export type CurrentChangeEvent = EventMeta & { version: 2 } & (
    | { type: 'change'; groupId: string; change: HabitChange }
    | { type: 'undo' | 'redo'; targetId: string; change: HabitChange }
    | { type: 'preference'; change: Extract<Change, { kind: 'haptics' }> }
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
};
export const emptyReplay = (): Replay => ({
  state: { habits: [], values: {}, hapticsEnabled: true },
  undo: [],
  redo: [],
  lastGroup: null,
  legacyUndo: [],
  legacyRedo: [],
  hasV2: false,
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
export function validateChange(value: unknown): asserts value is Change {
  object(value);
  if (value.kind === 'entry') {
    keys(value, ['kind', 'habitId', 'date', 'before', 'after']);
    id(value.habitId);
    insist(validDate(value.date), 'Invalid calendar date.');
    amount(value.before);
    amount(value.after);
  } else if (value.kind === 'colour') {
    keys(value, ['kind', 'habitId', 'before', 'after']);
    id(value.habitId);
    colour(value.before);
    colour(value.after);
  } else if (value.kind === 'haptics') {
    keys(value, ['kind', 'before', 'after']);
    insist(
      typeof value.before === 'boolean' && typeof value.after === 'boolean',
      'Invalid preference.',
    );
  } else throw new Error('Unsupported change type.');
  insist(value.before !== value.after, 'A change must change a value.');
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
    value.version === 1 || value.version === 2,
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
        value.habits.length > 0 &&
        value.habits.length <= 1000,
      'Invalid initial habits.',
    );
    const ids = new Set<string>();
    for (const habit of value.habits) {
      object(habit);
      keys(habit, [
        'id',
        'name',
        'color',
        ...(Object.hasOwn(habit, 'unit') ? ['unit'] : []),
      ]);
      id(habit.id);
      colour(habit.color);
      insist(!ids.has(habit.id), 'Duplicate habit identifier.');
      ids.add(habit.id);
      insist(
        typeof habit.name === 'string' &&
          habit.name.trim().length > 0 &&
          habit.name.length <= 200,
        'Invalid habit name.',
      );
      if (Object.hasOwn(habit, 'unit'))
        insist(
          typeof habit.unit === 'string' &&
            habit.unit.trim().length > 0 &&
            habit.unit.length <= 80,
          'Invalid unit.',
        );
    }
  } else if (
    value.type === 'change' ||
    value.type === 'undo' ||
    value.type === 'redo' ||
    (value.version === 2 && value.type === 'preference')
  ) {
    const grouped = value.version === 2 && value.type === 'change';
    keys(value, [
      ...common,
      'change',
      ...(value.type === 'undo' || value.type === 'redo' ? ['targetId'] : []),
      ...(grouped ? ['groupId'] : []),
    ]);
    validateChange(value.change);
    if (value.type === 'undo' || value.type === 'redo') id(value.targetId);
    if (grouped) id(value.groupId);
    if (value.version === 2)
      insist(
        value.type === 'preference'
          ? value.change.kind === 'haptics'
          : value.change.kind !== 'haptics',
        'Preferences cannot be habit actions.',
      );
  } else throw new Error('Unsupported event type.');
}

export function inverse(change: Change): Change {
  return { ...change, before: change.after, after: change.before } as Change;
}
function sameChange(left: Change, right: Change): boolean {
  return (
    left.kind === right.kind &&
    left.before === right.before &&
    left.after === right.after &&
    (left.kind === 'haptics' ||
      (right.kind !== 'haptics' && left.habitId === right.habitId)) &&
    (left.kind !== 'entry' ||
      (right.kind === 'entry' && left.date === right.date))
  );
}
export function applyEvent(previous: Replay, event: StoredEvent): Replay {
  return reduceEvent(previous, event, false);
}
function sameField(left: Change, right: Change) {
  return (
    left.kind === right.kind &&
    (left.kind === 'haptics' ||
      (right.kind !== 'haptics' && left.habitId === right.habitId)) &&
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
  if (!group) return false;
  const elapsed = Date.parse(meta.recordedAt) - Date.parse(group.recordedAt);
  return (
    sameField(group.change, change) &&
    group.change.after === change.before &&
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
      event.sequence === 1 && previous.state.habits.length === 0,
      'Initialization must be first and unique.',
    );
    return {
      ...emptyReplay(),
      state: {
        habits: event.habits.map((habit) => ({ ...habit })),
        values: {},
        hapticsEnabled: true,
      },
      hasV2: event.version === 2,
    };
  }
  insist(previous.state.habits.length > 0, 'Missing initialization.');
  insist(
    !previous.hasV2 || event.version === 2,
    'Legacy events cannot follow version-2 events.',
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
      if (event.change.kind !== 'haptics') {
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
      if (event.change.kind !== 'haptics') {
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
      if (event.change.kind !== 'haptics') {
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
        if (lastGroup.change.before !== lastGroup.change.after) {
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
      if (action.change.before !== action.change.after) undo.push(action);
      redo.length = 0;
      lastGroup = action;
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
    state: reduceChange(previous.state, event.change, mutable),
    undo,
    redo,
    lastGroup,
    legacyUndo,
    legacyRedo,
    hasV2: previous.hasV2 || event.version === 2,
  };
}
export function applyChange(state: StoredState, change: Change): StoredState {
  return reduceChange(state, change, false);
}
function reduceChange(
  state: StoredState,
  change: Change,
  mutable: boolean,
): StoredState {
  validateChange(change);
  let next: StoredState;
  if (change.kind === 'haptics') {
    insist(
      state.hapticsEnabled === change.before,
      'Preference precondition failed.',
    );
    if (mutable) {
      state.hapticsEnabled = change.after;
      next = state;
    } else next = { ...state, hapticsEnabled: change.after };
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
        (state.values[key] ?? null) === change.before,
        'Daily value precondition failed.',
      );
      if (!habit.unit)
        insist(
          [change.before, change.after].every(
            (value) => value === null || value === 1,
          ),
          'Checkbox entries must be checked or absent.',
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
  if (change.kind === 'haptics')
    return `Haptics ${change.after ? 'on' : 'off'}`;
  const habit = state.habits.find((habit) => habit.id === change.habitId);
  const name = habit?.name ?? 'Habit';
  if (change.kind === 'colour') return `${name} · Colour changed`;
  const value =
    change.after === null
      ? 'Cleared'
      : habit?.unit
        ? `${change.after} ${habit.unit}`
        : 'Checked';
  return `${name} · ${value}`;
}
