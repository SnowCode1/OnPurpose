import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import React, { act } from 'react';
import * as jsx from 'react/jsx-runtime';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { gridRowBucket, gridRowRange } from '../src/gridRowWindow.ts';
import { habitRowPositions } from '../src/habitOrdering.ts';

function load(file, imports, context = {}) {
  const module = { exports: {} };
  runInNewContext(
    ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => {
        if (name === 'react') return React;
        if (name === 'react/jsx-runtime') return jsx;
        if (!(name in imports)) throw new Error(`Unexpected module ${name}`);
        return imports[name];
      },
      ...context,
    },
    { timeout: 500 },
  );
  return module.exports;
}
function browserRoot(t) {
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
  return root;
}

test('one row controller serves all columns; recycling/rotation retains owners and removal releases only that habit', async (t) => {
  const root = browserRoot(t);
  let created = 0,
    alive = 0;
  const received = new Map();
  const View = ({ children, ref, testID, style }) => {
    if (testID) received.set(testID, style.at(-1));
    return React.createElement('div', { ref, 'data-testid': testID }, children);
  };
  const { RowPositions, ReorderRow } = load('../src/ReorderRow.tsx', {
    'react-native': { View },
    'react-native-reanimated': {
      __esModule: true,
      default: { View },
      useAnimatedStyle(updater) {
        const latest = React.useRef(updater);
        React.useLayoutEffect(() => {
          latest.current = updater;
        });
        const [style] = React.useState(() => ({
          read: () => latest.current(),
        }));
        React.useEffect(() => {
          created++;
          alive++;
          return () => {
            alive--;
          };
        }, []);
        return style;
      },
    },
  });
  const rowTops = { value: { a: 0, b: 52 } },
    dragY = { value: 180 },
    bodyTop = { value: 30 },
    scrollOffset = { value: 12 };
  const motion = (id, active = false) => ({
    id,
    rowTops,
    dragY,
    bodyTop,
    scrollOffset,
    active,
    top: rowTops.value[id],
  });
  let motions = { a: motion('a'), b: motion('b') };
  const render = async (generation, count = 12, stationary = false) =>
    act(() =>
      root.render(
        React.createElement(
          RowPositions,
          { motions },
          [
            'name',
            'loading',
            ...Array.from({ length: count }, (_, i) => `${generation}_${i}`),
          ].flatMap((column) =>
            Object.values(motions).map((m) =>
              React.createElement(ReorderRow, {
                key: `${column}:${m.id}`,
                motion: m,
                testID: `${column}:${m.id}`,
                animatedPosition:
                  column === 'name' || column === 'loading' || !stationary,
              }),
            ),
          ),
        ),
      ),
    );
  await render('portrait');
  assert.equal(created, 2);
  assert.equal(alive, 2);
  const positionA = received.get('name:a'),
    positionB = received.get('name:b');
  assert.notEqual(positionA, positionB);
  assert.equal(received.get('portrait_0:a'), positionA);
  assert.equal(received.get('loading:a'), positionA);
  assert.equal(positionB.read().transform[0].translateY, 52);
  await render('landscape', 28);
  assert.equal(created, 2, 'new date views attach to the existing two owners');
  assert.equal(received.get('landscape_27:a'), positionA);
  await render('landscape', 28, true);
  assert.equal(created, 2, 'stationary cells retain their existing owners');
  assert.notEqual(received.get('landscape_27:a'), positionA);
  assert.equal(received.get('landscape_27:a').transform[0].translateY, 0);
  assert.equal(received.get('name:a'), positionA);
  assert.equal(received.get('loading:a'), positionA);
  await render('landscape', 28);
  assert.equal(
    received.get('landscape_27:a'),
    positionA,
    'movement reconnects the same handle',
  );
  rowTops.value = { a: 52, b: 0 };
  assert.equal(positionA.read().transform[0].translateY, 52);
  assert.equal(positionB.read().transform[0].translateY, 0);
  motions = { ...motions, a: motion('a', true) };
  await render('landscape', 28);
  assert.equal(received.get('name:a'), positionA);
  assert.equal(positionA.read().transform[0].translateY, 162);
  assert.equal(positionA.read().zIndex, 1);
  dragY.value = 206;
  assert.equal(
    positionA.read().transform[0].translateY,
    188,
    'UI values move the shared style without React',
  );
  motions = { a: motion('a') };
  await render('portrait');
  assert.equal(alive, 1);
  assert.equal(created, 2);
  assert.equal(received.get('portrait_0:a'), positionA);
  motions = { ...motions, b: motion('b') };
  await render('portrait');
  assert.equal(created, 3);
  assert.equal(alive, 2);
  assert.notEqual(received.get('name:b'), positionB);
  assert.equal(received.get('portrait_0:b'), received.get('name:b'));
});

test('row windows cover wrapped/scaled visible rows throughout a bucket and reduce off-screen cells', () => {
  const rows = Array.from({ length: 30 }, (_, i) => ({ id: `h${i}` }));
  for (const base of [32, 52, 78, 104]) {
    const heights = { h2: base * 3, h12: base * 2.5 };
    const { tops, total } = habitRowPositions(
      rows.map((h) => h.id),
      heights,
      base,
    );
    for (const viewport of [base * 2, base * 4, base * 12])
      for (let offset = 0; offset < total; offset += base / 3) {
        const range = gridRowRange(
          rows,
          tops,
          heights,
          base,
          gridRowBucket(offset, base),
          viewport,
        );
        assert.ok(range.start >= 0 && range.end <= rows.length);
        for (const [index, row] of rows.entries())
          if (
            tops[row.id] < offset + viewport &&
            tops[row.id] + (heights[row.id] ?? base) > offset
          )
            assert.ok(
              index >= range.start && index < range.end,
              'every actual visible row is retained despite bucket rounding',
            );
      }
    assert.deepEqual(gridRowRange(rows, tops, heights, base, 0, 0), {
      start: 0,
      end: 30,
    });
  }
  const { tops } = habitRowPositions(
    rows.map((h) => h.id),
    {},
    52,
  );
  const range = gridRowRange(rows, tops, {}, 52, 0, 208);
  assert.equal(
    range.end - range.start,
    6,
    'a four-row viewport initially builds six of thirty rows',
  );
  assert.equal(gridRowBucket(-40, 52), 0);
});

test('row window updates occur only at buckets; reorder and removal retain full rows through the movement', async (t) => {
  const root = browserRoot(t);
  const timers = new Map();
  let nextTimer = 0,
    renders = 0,
    current;
  const { useGridRowWindow } = load(
    '../src/useGridRowWindow.ts',
    {
      './gridRowWindow': { gridRowBucket, gridRowRange },
    },
    {
      setTimeout: (fn) => {
        timers.set(++nextTimer, fn);
        return nextTimer;
      },
      clearTimeout: (id) => timers.delete(id),
    },
  );
  const rows = Array.from({ length: 30 }, (_, i) => ({ id: `h${i}` }));
  function Subject({ habits = rows, reorder = false }) {
    const { tops } = habitRowPositions(
      habits.map((h) => h.id),
      {},
      52,
    );
    current = useGridRowWindow(habits, tops, {}, 52, reorder);
    renders++;
    return null;
  }
  const render = async (props = {}) =>
    act(() => root.render(React.createElement(Subject, props)));
  await render();
  assert.equal(current.rows, rows, 'unknown viewport must not omit data');
  await act(() => current.setViewport(208));
  assert.equal(current.rows.length, 6);
  const stableRows = current.rows,
    settledRenders = renders;
  await act(() => {
    for (let y = 1; y < 104; y++) current.updateOffset(y);
  });
  assert.equal(renders, settledRenders);
  assert.equal(current.rows, stableRows);
  await act(() => current.updateOffset(208));
  assert.deepEqual(
    current.rows.map((h) => h.id),
    rows.slice(2, 10).map((h) => h.id),
  );
  await render({ reorder: true });
  assert.equal(current.rows, rows);
  await render();
  assert.equal(current.rows.length, 8);
  const remaining = rows.filter((h) => h.id !== 'h1');
  await render({ habits: remaining });
  assert.equal(
    current.rows,
    remaining,
    'keep every survivor while shared row positions animate',
  );
  assert.equal(timers.size, 1);
  const restored = [...remaining, rows[1]];
  await render({ habits: restored });
  assert.equal(
    timers.size,
    1,
    'rapid identity changes replace the quiet timer',
  );
  assert.equal(current.rows, restored);
  await act(() => [...timers.values()][0]());
  assert.equal(current.rows.length, 8);
  await render({ habits: restored, reorder: true });
  assert.equal(
    current.rows,
    restored,
    'drag/menu access always retains complete rows',
  );
});

test('checkbox animation state is lazy, tap-only, restartable and cancelled on recycled identity/reduced motion', async (t) => {
  const root = browserRoot(t);
  let allocations = 0,
    starts = 0,
    stops = 0,
    reduced = false;
  const timed = [];
  class Value {
    constructor(initial) {
      allocations++;
      this.value = initial;
    }
    setValue(value) {
      this.value = value;
    }
    stopAnimation() {
      stops++;
    }
  }
  const View = ({ children }) => React.createElement('div', null, children);
  const { GridCheckboxMark } = load('../src/GridCheckboxMark.tsx', {
    'react-native': {
      View,
      Animated: {
        View,
        Value,
        timing: (value, config) => {
          timed.push(config);
          return { value, config };
        },
        sequence: () => ({
          start: () => {
            starts++;
          },
        }),
      },
      Easing: { out: (v) => v, quad: 'quad', cubic: 'cubic' },
    },
    'react-native-reanimated': { useReducedMotion: () => reduced },
    './Icon': { Icon: () => null },
  });
  const ref = React.createRef();
  const render = async (identity, checked = false) =>
    act(() =>
      root.render(
        React.createElement(GridCheckboxMark, {
          ref,
          identity,
          checked,
          style: 'boxes',
          size: 28,
          colour: '#82E6BC',
          checkmark: '#000000',
        }),
      ),
    );
  await render('a:today');
  await render('a:yesterday', true);
  await render('a:tomorrow');
  assert.equal(allocations, 0);
  assert.equal(starts, 0);
  assert.equal(stops, 0);
  await act(() => ref.current.pulse());
  assert.equal(allocations, 1);
  assert.equal(starts, 1);
  await act(() => {
    ref.current.pulse();
    ref.current.pulse();
  });
  assert.equal(allocations, 1);
  assert.equal(starts, 3);
  for (const config of timed) {
    assert.equal(config.useNativeDriver, true);
    assert.equal(config.isInteraction, false);
  }
  const cancelled = stops;
  await render('a:next-day');
  assert.ok(stops > cancelled);
  assert.equal(starts, 3, 'recycling must not pulse');
  await render('a:next-day', true);
  assert.equal(starts, 3, 'an external checked-state update must not pulse');
  reduced = true;
  await render('a:next-day');
  await act(() => ref.current.pulse());
  assert.equal(starts, 3);
  await act(() => {
    root.render(
      React.createElement(GridCheckboxMark, {
        ref,
        identity: 'new:today',
        checked: false,
        style: 'marks',
        size: 22,
        colour: '#BDA5FF',
        checkmark: '#000000',
        key: 'new',
      }),
    );
  });
  await act(() => ref.current.pulse());
  assert.equal(
    allocations,
    1,
    'a reduced-motion tap should not allocate animation state',
  );
});
