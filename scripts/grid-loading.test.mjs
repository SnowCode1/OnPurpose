import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadingStripOffset,
  loadingEdgeMasks,
  gridRenderBudget,
} from '../src/gridLoading.ts';

test('loading marks stay aligned with inverted native date columns at every fractional scroll position', () => {
  for (const visible of [1, 4, 10])
    for (const columnWidth of [48, 53.25, 96]) {
      const viewport = visible * columnWidth;
      for (const offset of [
        -63.9,
        -12,
        0,
        0.3,
        28.7,
        columnWidth,
        631.5,
        12000.2,
      ]) {
        const translation = loadingStripOffset(offset, columnWidth);
        assert.ok(translation >= -columnWidth && translation < 0);
        const marks = Array.from(
          { length: visible + 2 },
          (_, i) => translation + i * columnWidth + columnWidth / 2,
        );
        // Native index zero is the rightmost date; increasing offset exposes older indices.
        const first = Math.floor(offset / columnWidth) - 1;
        for (let index = first; index < first + visible + 3; index++) {
          const centre = viewport - (index + 0.5) * columnWidth + offset;
          if (centre >= 0 && centre <= viewport)
            assert.ok(marks.some((mark) => Math.abs(mark - centre) < 1e-7));
        }
      }
    }
  assert.equal(loadingStripOffset(200, 0), 0);
});
test('rubber-band masks cover only space outside loaded dates, including future batches and extreme pulls', () => {
  for (const width of [192, 533])
    for (const maximum of [0, 4500, 6200]) {
      assert.deepEqual(loadingEdgeMasks(0, maximum, width), {
        left: 0,
        right: 0,
      });
      assert.deepEqual(loadingEdgeMasks(maximum, maximum, width), {
        left: 0,
        right: 0,
      });
      assert.deepEqual(loadingEdgeMasks(-64, maximum, width), {
        left: 0,
        right: -64,
      });
      assert.deepEqual(loadingEdgeMasks(maximum + 32, maximum, width), {
        left: 32,
        right: 0,
      });
      assert.deepEqual(loadingEdgeMasks(-100000, maximum, width), {
        left: 0,
        right: -width,
      });
      assert.deepEqual(loadingEdgeMasks(maximum + 100000, maximum, width), {
        left: width,
        right: 0,
      });
    }
});
test('render batches cover the viewport and give lightweight headings a wider lead in both orientations', () => {
  for (const visible of [1, 2, 4, 10, 18]) {
    const budget = gridRenderBudget(visible);
    assert.ok(budget.bodyBatch >= visible);
    assert.ok(budget.headerBatch > budget.bodyBatch);
    assert.ok(budget.headerWindow > budget.bodyWindow);
    assert.ok(budget.batchPeriod > 0 && budget.batchPeriod < 50);
  }
});
