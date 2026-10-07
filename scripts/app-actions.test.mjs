import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React, { act, useLayoutEffect } from 'react';
import * as jsx from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { ChangeStore } from '../src/storage/store.ts';
import { replayEvents } from '../src/storage/model.ts';
import * as entries from '../src/entries.ts';
import * as habits from '../src/habits.ts';
import * as goals from '../src/habitGoals.ts';
import * as colors from '../src/colors.ts';
import * as suggestions from '../src/numericSuggestions.ts';

// Execute the actual controllers/components with small native mocks. Never print
// native/browser object graphs, and release each browser/root after its test.
function load(file, modules) {
  const module = { exports: {} };
  const code = ts.transpileModule(
    readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    },
  ).outputText;
  runInNewContext(
    code,
    {
      module,
      exports: module.exports,
      Error,
      require(name) {
        if (!(name in modules)) throw new Error(`Unexpected module ${name}`);
        return modules[name];
      },
    },
    { timeout: 500 },
  );
  return module.exports;
}
const common = { react: React, 'react/jsx-runtime': jsx };
async function mount(t) {
  const browser = new JSDOM('<div id="root"></div>');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
  };
  globalThis.window = browser.window;
  globalThis.document = browser.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(() => root.unmount());
    browser.window.close();
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
  });
  return async (element) => act(() => root.render(element));
}
const Container = ({ children }) => React.createElement('div', null, children);
const Text = ({ children }) => React.createElement('span', null, children);
let sequenceId = 0;
async function fixture() {
  const definitions = [
    { id: 'read', name: 'Read', type: 'number', color: '#BDA5FF' },
    {
      id: 'walk',
      name: 'Walk',
      type: 'checkbox',
      color: '#82E6BC',
      goals: [
        {
          id: 'goal',
          from: '2026-01-01',
          rule: { kind: 'unchecked' },
          weekdays: [0, 1, 2, 3, 4, 5, 6],
          defaultChecked: true,
        },
      ],
    },
    {
      id: 'workout',
      name: 'Workout',
      type: 'categorical',
      color: '#82E6BC',
      categories: [
        { id: 'run', label: 'Run' },
        { id: 'gym', label: 'Gym' },
      ],
    },
  ];
  const meta = (sequence) => ({
    version: 17,
    id: `action_${++sequenceId}`,
    sequence,
    recordedAt: '2026-10-07T00:00:00.000Z',
    timeZone: 'UTC',
    utcOffsetMinutes: 0,
  });
  const events = [{ ...meta(1), type: 'initialize', habits: definitions }];
  const store = new ChangeStore(
    {
      load: async () => ({ ...replayEvents(events), hasRecovery: false }),
      append: async (event) => {
        events.push(event);
      },
    },
    meta,
  );
  await store.load();
  assert.equal(store.getSnapshot().status, 'ready');
  const feedback = [],
    receipts = [];
  const { useDailyEntryActions } = load('useDailyEntryActions.ts', {
    ...common,
    './entries': entries,
    './habits': habits,
    './habitGoals': goals,
    './haptics': { feedback: (kind) => feedback.push(kind) },
  });
  const capture = (change) => receipts.push(change);
  return {
    store,
    useDailyEntryActions,
    capture,
    feedback,
    receipts,
    definitions,
  };
}
const day = { key: '2026-10-07', fullLabel: 'Wednesday, 7 October 2026' };

test('numeric drafts stay local; Close cancels, invalid input cannot save, and Done uses the latest value with zero distinct from blank', async (t) => {
  const render = await mount(t);
  const { store, useDailyEntryActions, capture, definitions, receipts } =
    await fixture();
  const controls = new Map();
  let input,
    actions,
    rootRenders = 0;
  function Pressable(props) {
    controls.set(
      props.accessibilityLabel ?? props.children?.props?.children,
      props,
    );
    return React.createElement(
      'button',
      { disabled: props.disabled },
      props.children,
    );
  }
  const { NumericRecordDialog } = load('NumericRecordDialog.tsx', {
    ...common,
    'react-native': {
      Modal: Container,
      KeyboardAvoidingView: Container,
      ScrollView: Container,
      View: Container,
      Pressable,
      Platform: { OS: 'ios' },
      StyleSheet: { create: (value) => value },
    },
    './Typography': {
      Text,
      TextInput: (props) => {
        input = props;
        return null;
      },
    },
    './colors': colors,
    './numericSuggestions': suggestions,
    './haptics': { feedback: () => {} },
  });
  function Host() {
    const controller = useDailyEntryActions(store, capture);
    useLayoutEffect(() => {
      rootRenders++;
      actions = controller;
    });
    const editor = controller.editing;
    return editor
      ? React.createElement(NumericRecordDialog, {
          key: editor.key,
          habit: editor.habit,
          day: editor.day,
          initialValue: editor.value,
          values: store.getSnapshot().replay.state.values,
          editable: store.canEdit(),
          Heading: Text,
          onClose: controller.closeNumber,
          onSave: controller.saveNumber,
        })
      : null;
  }
  await render(React.createElement(Host));
  const press = async () => act(() => actions.pressCell(definitions[0], day));
  const type = async (text) => act(() => input.onChangeText(text));
  const done = async () => act(() => controls.get('Done').onPress());
  await press();
  const afterOpen = rootRenders;
  for (const text of ['1', '12', '12,5']) await type(text);
  assert.equal(rootRenders, afterOpen, 'typing must not revisit the app/host');
  assert.equal(store.getSnapshot().events.length, 1);
  await act(() => controls.get('Close').onPress());
  assert.equal(store.getSnapshot().events.length, 1);
  await press();
  assert.equal(input.value, '', 'cancelled draft must not reappear');
  for (const text of ['-1', 'NaN', '1e3', '9007199254740992']) {
    await type(text);
    assert.equal(controls.get('Done').disabled, true);
    await act(() => input.onSubmitEditing());
    assert.notEqual(actions.editing, null);
    assert.equal(store.getSnapshot().events.length, 1);
  }
  await type('0');
  await done();
  assert.equal(store.getSnapshot().replay.state.values['read:2026-10-07'], 0);
  assert.equal(receipts.at(-1).after, 0);
  await press();
  await type('12,5');
  store.change({
    kind: 'entry',
    habitId: 'read',
    date: day.key,
    before: 0,
    after: 7,
  });
  await done();
  assert.equal(
    receipts.at(-1).before,
    7,
    'Done must not reuse the opening value',
  );
  assert.equal(receipts.at(-1).after, 12.5);
  await press();
  await type('');
  await done();
  assert.equal(
    store.getSnapshot().replay.state.values['read:2026-10-07'],
    undefined,
  );
  assert.equal(receipts.at(-1).after, null);
  await press();
  await type('3');
  const change = store.change.bind(store);
  store.change = () => false;
  await done();
  assert.notEqual(actions.editing, null, 'rejected saves retain the draft');
  store.change = change;
  await done();
  assert.equal(actions.editing, null);
  await store.flush();
});

test('shared daily actions preserve dated checkbox defaults, grouped no-ops, blocked saves and stable grid callbacks', async (t) => {
  const render = await mount(t);
  const {
    store,
    useDailyEntryActions,
    capture,
    definitions,
    receipts,
    feedback,
  } = await fixture();
  let actions;
  function Host() {
    const controller = useDailyEntryActions(store, capture);
    useLayoutEffect(() => {
      actions = controller;
    });
    return null;
  }
  await render(React.createElement(Host));
  const press = actions.pressCell;
  await act(() => actions.pressCell(definitions[1], day));
  assert.equal(store.getSnapshot().replay.state.values['walk:2026-10-07'], 0);
  assert.equal(feedback.at(-1), 'undo');
  await act(() => actions.pressCell(definitions[1], day));
  assert.equal(
    store.getSnapshot().replay.state.values['walk:2026-10-07'],
    undefined,
  );
  assert.equal(
    store.getSnapshot().replay.undo.length,
    0,
    'net-zero toggling still coalesces',
  );
  await act(() => actions.pressCell(definitions[2], day));
  assert.equal(
    actions.pressCell,
    press,
    'opening a draft must not change the grid callback',
  );
  assert.equal(actions.saveRecord(['gym', 'run']), true);
  const count = receipts.length,
    events = store.getSnapshot().events.length;
  assert.equal(actions.saveRecord(['gym', 'run']), true);
  assert.equal(receipts.length, count);
  assert.equal(store.getSnapshot().events.length, events);
  // Exclusive backup work disables every entry path, including unchanged saves.
  await store.exclusive(async () => {
    assert.equal(actions.saveRecord(['gym', 'run']), false);
    await act(() => actions.pressCell(definitions[0], day));
    assert.equal(actions.editing, null);
  });
  await act(() => actions.closeEntries());
  assert.equal(actions.recording, null);
  await store.flush();
});

function backupHarness(chooseBackup, shareBackup) {
  const alerts = [],
    calls = [];
  const { useBackupActions } = load('useBackupActions.ts', {
    ...common,
    'react-native': { Alert: { alert: (...args) => alerts.push(args) } },
    './storage/backups': { chooseBackup, shareBackup },
  });
  const store = {
    exclusive: async (task) => {
      calls.push('exclusive:start');
      await task();
      calls.push('exclusive:end');
    },
    replace: async (events) => {
      calls.push(events);
    },
    recoveryEvents: async () => {
      calls.push('recovery');
      return ['recovery-events'];
    },
  };
  return { alerts, calls, store, useBackupActions };
}

test('backup restore still waits for named native confirmation and delegates replacement/recovery to the exclusive store', async (t) => {
  const render = await mount(t);
  const archive = {
    replay: { state: { habits: [{ id: 'walk' }] } },
    events: ['init', 'change'],
  };
  const harness = backupHarness(
    async () => archive,
    async () => {},
  );
  let actions;
  function Host() {
    actions = harness.useBackupActions(harness.store, false);
    return null;
  }
  await render(React.createElement(Host));
  let pending;
  await act(async () => {
    pending = actions.restoreBackup();
    await Promise.resolve();
  });
  assert.equal(actions.backupBusy, true);
  assert.equal(harness.calls.length, 0);
  assert.equal(harness.alerts.at(-1)[0], 'Restore this backup?');
  await act(async () => {
    harness.alerts.at(-1)[2][0].onPress();
    await pending;
  });
  assert.equal(actions.backupBusy, false);
  assert.equal(harness.calls.length, 0, 'Cancel must never replace data');
  await act(async () => {
    pending = actions.restoreBackup();
    await Promise.resolve();
  });
  await act(async () => {
    harness.alerts.at(-1)[2][1].onPress();
    await pending;
  });
  assert.equal(harness.calls[0], 'exclusive:start');
  assert.equal(harness.calls[1], archive.events);
  assert.equal(harness.calls[2], 'exclusive:end');
  await act(() => actions.recoverPrevious());
  assert.equal(harness.calls.length, 3);
  await act(async () => harness.alerts.at(-1)[2][1].onPress());
  assert.equal(harness.calls[3], 'exclusive:start');
  assert.equal(harness.calls[4], 'recovery');
  assert.equal(harness.calls[5][0], 'recovery-events');
  assert.equal(harness.calls[6], 'exclusive:end');
});

test('backup work ignores rapid duplicate presses and sample mode, releases its busy guard after failure or cancelled picking', async (t) => {
  const render = await mount(t);
  let release,
    shares = 0;
  const harness = backupHarness(
    async () => null,
    async () => {
      shares++;
      await new Promise((resolve) => {
        release = resolve;
      });
      throw new Error('Share failed');
    },
  );
  let actions;
  function Host({ sample }) {
    actions = harness.useBackupActions(harness.store, sample);
    return null;
  }
  await render(React.createElement(Host, { sample: false }));
  let pending;
  await act(async () => {
    pending = actions.exportBackup();
    await actions.exportBackup();
  });
  assert.equal(shares, 1, 'the ref must guard even before React commits busy');
  assert.equal(actions.backupBusy, true);
  await act(async () => {
    release();
    await pending;
  });
  assert.equal(actions.backupBusy, false);
  assert.equal(harness.alerts.at(-1)[1], 'Share failed');
  await act(async () => actions.restoreBackup());
  assert.equal(actions.backupBusy, false);
  assert.equal(harness.calls.length, 0);
  await render(React.createElement(Host, { sample: true }));
  const alertCount = harness.alerts.length;
  await act(async () => {
    await actions.exportBackup();
    await actions.restoreBackup();
    actions.recoverPrevious();
  });
  assert.equal(harness.alerts.length, alertCount);
  assert.equal(shares, 1);
});

test('the independent statistics chart preserves tap-to-clear, accessible selection and date identity when buckets change', async (t) => {
  const render = await mount(t);
  let chart, clear;
  function Pressable(props) {
    if (props.accessibilityLabel === 'Trend chart') chart = props;
    else clear = props;
    return React.createElement('button', null, props.children);
  }
  const formatting = load('statisticsFormatting.ts', {});
  const { StatsChart } = load('StatsChart.tsx', {
    ...common,
    'react-native': {
      View: Container,
      Pressable,
      StyleSheet: { create: (value) => value },
    },
    'react-native-svg': {
      default: Container,
      Line: () => null,
      Rect: () => null,
      __esModule: true,
    },
    './Typography': { Text },
    './statisticsFormatting': formatting,
  });
  const first = { start: '2026-10-01', end: '2026-10-01', value: 40 };
  const second = { start: '2026-10-02', end: '2026-10-02', value: 80 };
  const show = (buckets) =>
    render(
      React.createElement(StatsChart, {
        buckets,
        colour: '#82E6BC',
        numeric: false,
        unit: '',
      }),
    );
  await show([first, second]);
  await act(() => chart.onPress({ nativeEvent: { locationX: 200 } }));
  assert.match(chart.accessibilityValue.text, /80% completed/);
  await act(() => chart.onPress({ nativeEvent: { locationX: 200 } }));
  assert.equal(chart.accessibilityValue.text, 'No period selected');
  await act(() =>
    chart.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } }),
  );
  assert.match(chart.accessibilityValue.text, /40% completed/);
  await show([second, first]);
  assert.match(
    chart.accessibilityValue.text,
    /40% completed/,
    'selection follows the dated bucket, not its old index',
  );
  await act(() => clear.onPress());
  assert.equal(chart.accessibilityValue.text, 'No period selected');
  await show([]);
  await act(() => chart.onPress({ nativeEvent: { locationX: 1 } }));
  await act(() =>
    chart.onAccessibilityAction({ nativeEvent: { actionName: 'decrement' } }),
  );
  assert.equal(chart.accessibilityValue.text, 'No period selected');
});
