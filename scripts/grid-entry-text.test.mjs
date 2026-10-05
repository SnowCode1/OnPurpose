import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import {
  gridEntryTextLines,
  GRID_ENTRY_LINE_HEIGHT,
} from '../src/gridEntryText.ts';
import { gridRowHeight } from '../src/rowSpacing.ts';
import { combinedTextScale } from '../src/textSize.ts';

test('cell line capacity follows row spacing and combined text scale without fitting more through shrinking', () => {
  assert.equal(gridEntryTextLines(44, 1), 2);
  assert.equal(gridEntryTextLines(52, 1), 2);
  assert.equal(gridEntryTextLines(64, 1), 3);
  assert.equal(gridEntryTextLines(44, 2), 1);
  for (const app of [0.85, 1, 1.15, 1.5]) {
    for (const system of [1, 1.3, 2]) {
      const scale = combinedTextScale(system, app);
      for (const spacing of ['compact', 'standard', 'roomy']) {
        const height = gridRowHeight(spacing, scale);
        const lines = gridEntryTextLines(height, scale);
        assert.ok(lines >= 1 && lines <= 3);
        assert.ok(lines * GRID_ENTRY_LINE_HEIGHT * scale <= height - 12);
      }
    }
  }
});

function autosizingExpressions(path) {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8');
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const expressions = [];
  function visit(node) {
    if (
      ts.isJsxAttribute(node) &&
      node.name.getText(file) === 'adjustsFontSizeToFit'
    ) {
      expressions.push(
        node.initializer && ts.isJsxExpression(node.initializer)
          ? node.initializer.expression.getText(file)
          : 'true',
      );
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return expressions;
}

test('actual grid and recording-calendar text cannot enter iOS autosizing that ignores minimumFontScale', () => {
  // Execute the actual JSX prop expression. The prior unconditional fitting
  // fails here even though its advertised minimum was 95%. No native/DOM graph.
  const grid = autosizingExpressions('../src/GridCells.tsx');
  assert.equal(grid.length, 1);
  assert.equal(
    runInNewContext(grid[0], { numeric: false }, { timeout: 100 }),
    false,
  );
  assert.equal(
    runInNewContext(grid[0], { numeric: true }, { timeout: 100 }),
    true,
  );
  assert.deepEqual(autosizingExpressions('../src/RecordStatsScreen.tsx'), []);
});
