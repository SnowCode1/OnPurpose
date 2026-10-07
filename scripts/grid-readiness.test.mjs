import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
// Exercise the actual native callback boundary without creating native lists or
// enormous DOM trees. Estimated recycler width must never block drawn cells.
const source = readFileSync(
  new URL('../src/HabitGrid.tsx', import.meta.url),
  'utf8',
);
const parsed = ts.createSourceFile(
  'HabitGrid.tsx',
  source,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
const names = new Set([
  'finishLayout',
  'listLoaded',
  'listLaidOut',
  'listSized',
]);
const functions = [];
function visit(node) {
  if (ts.isFunctionDeclaration(node) && names.has(node.name?.text))
    functions.push(node.getText(parsed));
  ts.forEachChild(node, visit);
}
visit(parsed);
assert.equal(functions.length, 4);
const code = ts.transpileModule(
  functions.join('\n') +
    '\nexports.handlers = { listLoaded, listLaidOut, listSized };',
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
function fixture(platform = 'ios') {
  const frame = {};
  const aligned = [],
    ready = [],
    navigated = [];
  const context = {
    exports: {},
    Platform: { OS: platform },
    frame,
    columnWidth: 55,
    dateWidth: 220,
    days: Array.from({ length: 120 }),
    layoutReady: {
      current: {
        frame,
        width: 55,
        target: 1650,
        headerSize: false,
        bodySize: false,
        headerLayout: false,
        bodyLayout: false,
      },
    },
    pendingNavigation: { current: null },
    setReadyFrame: (value) => ready.push(value),
    alignGeometry: (offset, complete) => aligned.push([offset, complete]),
    scrollToDay: (day, arrive) => {
      navigated.push(day);
      arrive();
    },
    setRightmostDay: () => {},
    revealWhenReady: () => {},
  };
  runInNewContext(code, context, { timeout: 500 });
  return {
    context,
    handlers: context.exports.handlers,
    aligned,
    ready,
    navigated,
  };
}
test('drawn native cells release after current viewports despite non-exact estimated content width', () => {
  const f = fixture();
  f.handlers.listLaidOut('header', 220);
  f.handlers.listLaidOut('body', 220);
  f.handlers.listSized('header', 6480);
  f.handlers.listSized('body', 6520);
  assert.equal(f.ready.length, 0);
  f.handlers.listLoaded('header');
  assert.equal(f.ready.length, 0);
  f.handlers.listLoaded('body');
  assert.equal(f.ready.length, 1);
  assert.equal(f.ready[0], f.context.frame);
  assert.deepEqual(f.aligned, [[1650, true]]);
  assert.equal(f.context.layoutReady.current, null);
  f.handlers.listLoaded('body');
  assert.equal(f.ready.length, 1);
});
test('stale rotation callbacks and old viewport sizes cannot reveal a new frame; draw/layout ordering is interchangeable', () => {
  const f = fixture();
  f.context.layoutReady.current.frame = {};
  f.handlers.listLoaded('header');
  f.handlers.listLoaded('body');
  f.handlers.listLaidOut('header', 220);
  assert.equal(f.ready.length, 0);
  assert.equal(f.context.layoutReady.current.headerSize, false);
  f.context.frame = f.context.layoutReady.current.frame;
  f.context.pendingNavigation.current = 35;
  f.handlers.listLoaded('header');
  f.handlers.listLoaded('body');
  f.handlers.listLaidOut('header', 660);
  f.handlers.listLaidOut('body', 660);
  assert.equal(f.ready.length, 0);
  f.handlers.listLaidOut('body', 220);
  assert.equal(f.ready.length, 0);
  f.handlers.listLaidOut('header', 220);
  assert.equal(f.ready.length, 1);
  assert.deepEqual(f.navigated, [35]);
  assert.equal(f.context.pendingNavigation.current, null);
});
test('web FlatList readiness still requires matching viewport and fixed content geometry', () => {
  const f = fixture('web');
  f.handlers.listLaidOut('header', 220);
  f.handlers.listLaidOut('body', 220);
  f.handlers.listSized('header', 6400);
  f.handlers.listSized('body', 6400);
  assert.equal(f.ready.length, 0);
  f.handlers.listSized('header', 6600);
  f.handlers.listSized('body', 6600);
  assert.equal(f.ready.length, 1);
});
