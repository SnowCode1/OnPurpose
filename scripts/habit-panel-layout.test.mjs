import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Exercise the actual native callbacks without a native renderer. React Native
// releases synthetic events before deferred React state updaters may execute.
const source = readFileSync(
  new URL('../src/HabitDetailsScreen.tsx', import.meta.url),
  'utf8',
);
const file = ts.createSourceFile(
  'HabitDetailsScreen.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const handlers = [];
function visit(node) {
  if (
    ts.isJsxAttribute(node) &&
    node.name.getText(file) === 'onLayout' &&
    ts.isJsxExpression(node.initializer) &&
    node.initializer.expression
  )
    handlers.push(node.initializer.expression.getText(file));
  ts.forEachChild(node, visit);
}
visit(file);

test('habit panel layout callbacks survive native event release before deferred state updates', () => {
  assert.equal(handlers.length, 2);
  const pending = [];
  let width = 0;
  let height = 54;
  const context = {
    setWidth: (update) => pending.push(() => (width = update(width))),
    setIslandHeight: (update) => pending.push(() => (height = update(height))),
  };
  const callbacks = handlers.map((handler) =>
    runInNewContext(
      ts.transpileModule(`(${handler})`, {
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
      }).outputText,
      context,
      { timeout: 100 },
    ),
  );
  for (const [nextWidth, nextHeight] of [
    [402, 54],
    [874, 76],
    [402, 100],
    [402, 100],
  ]) {
    for (const callback of callbacks) {
      const event = {
        nativeEvent: { layout: { width: nextWidth, height: nextHeight } },
      };
      callback(event);
      event.nativeEvent = null;
    }
    while (pending.length) pending.shift()();
    assert.equal(width, nextWidth);
    assert.equal(height, nextHeight);
  }
});
