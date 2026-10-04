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
export type EventMeta = {
  version: 1;
  id: string;
  sequence: number;
  recordedAt: string;
  timeZone: string;
  utcOffsetMinutes: number;
};
export type ChangeEvent = EventMeta &
  (
    | { type: 'change'; change: Change }
    | { type: 'undo' | 'redo'; targetId: string; change: Change }
  );
export type StoredEvent =
  (EventMeta & { type: 'initialize'; habits: Habit[] }) | ChangeEvent;
export type Replay = {
  state: StoredState;
  undo: ChangeEvent[];
  redo: ChangeEvent[];
};
export const emptyReplay = (): Replay => ({
  state: { habits: [], values: {}, hapticsEnabled: true },
  undo: [],
  redo: [],
});

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
  insist(value.version === 1, 'Unsupported event version.');
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
    value.type === 'redo'
  ) {
    keys(value, [
      ...common,
      'change',
      ...(value.type === 'change' ? [] : ['targetId']),
    ]);
    validateChange(value.change);
    if (value.type !== 'change') id(value.targetId);
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
// Replay owns its fresh state, so it can avoid copying the entire history for each event.
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
      state: {
        habits: event.habits.map((habit) => ({ ...habit })),
        values: {},
        hapticsEnabled: true,
      },
      undo: [],
      redo: [],
    };
  }
  insist(previous.state.habits.length > 0, 'Missing initialization.');
  const undo = mutable ? previous.undo : [...previous.undo];
  const redo = mutable ? previous.redo : [...previous.redo];
  if (event.type === 'undo') {
    const target = undo.at(-1);
    insist(
      target &&
        target.id === event.targetId &&
        sameChange(event.change, inverse(target.change)),
      'Invalid undo target or inverse.',
    );
    undo.pop();
    redo.push(event);
  } else if (event.type === 'redo') {
    const target = redo.at(-1);
    insist(
      target &&
        target.id === event.targetId &&
        sameChange(event.change, inverse(target.change)),
      'Invalid redo target or inverse.',
    );
    redo.pop();
    undo.push(event);
  } else {
    undo.push(event);
    redo.length = 0;
  }
  return {
    state: reduceChange(previous.state, event.change, mutable),
    undo,
    redo,
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
