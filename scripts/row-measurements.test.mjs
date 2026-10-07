import test from 'node:test';
import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { useMeasuredRowHeights } from '../src/useMeasuredRowHeights.ts';
test('rotation batches name heights into one update and discards stale geometry events', async (t) => {
  const browser = new JSDOM('<div id="root"></div>');
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    act: globalThis.IS_REACT_ACT_ENVIRONMENT,
    raf: globalThis.requestAnimationFrame,
    cancel: globalThis.cancelAnimationFrame,
  };
  globalThis.window = browser.window;
  globalThis.document = browser.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const frames = new Map();
  let frameId = 0;
  globalThis.requestAnimationFrame = (fn) => {
    frames.set(++frameId, fn);
    return frameId;
  };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);
  const root = createRoot(document.getElementById('root'));
  t.after(async () => {
    await act(() => root.unmount());
    browser.window.close();
    globalThis.window = previous.window;
    globalThis.document = previous.document;
    globalThis.IS_REACT_ACT_ENVIRONMENT = previous.act;
    globalThis.requestAnimationFrame = previous.raf;
    globalThis.cancelAnimationFrame = previous.cancel;
  });
  let model,
    renders = 0;
  function Rows({ geometry }) {
    renders++;
    model = useMeasuredRowHeights(geometry);
    return null;
  }
  const render = async (geometry) =>
    act(() => root.render(React.createElement(Rows, { geometry })));
  const flush = async () =>
    act(() => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((fn) => fn());
    });
  await render('portrait');
  for (let i = 0; i < 20; i++) model.measure(`habit_${i}`, 52 + i, 'portrait');
  assert.equal(frames.size, 1);
  assert.equal(renders, 1);
  await flush();
  assert.equal(renders, 2);
  assert.equal(Object.keys(model.heights).length, 20);
  model.measure('habit_0', 80, 'portrait');
  await render('landscape');
  assert.equal(frames.size, 0);
  model.measure('habit_0', 90, 'portrait');
  assert.equal(frames.size, 0);
  model.measure('habit_0', 52, 'landscape');
  model.measure('habit_1', 0, 'landscape');
  model.measure('habit_2', Number.NaN, 'landscape');
  await flush();
  assert.equal(model.heights.habit_0, 52);
  assert.equal(model.heights.habit_1, 53);
  model.measure('habit_0', 52, 'landscape');
  const heights = model.heights;
  await flush();
  assert.equal(model.heights, heights);
});
