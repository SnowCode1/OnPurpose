import test from 'node:test';
import assert from 'node:assert/strict';
import {
  columnSpacingOptions,
  weekDayOrder,
} from '../src/displayPreferences.ts';
import { gridLayout } from '../src/gridLayout.ts';
import { createGridPalette } from '../src/gridAppearance.ts';
import { monthDays } from '../src/statistics.ts';

test('column spacing fits whole dates and preserves name width across orientations and text sizes', () => {
  for (const width of [284, 339, 366, 404, 680, 716, 812]) {
    for (const scale of [1, 1.3, 2, 3]) {
      const compact = gridLayout(width, scale);
      let previousDays = Infinity;
      for (const option of columnSpacingOptions) {
        const layout = gridLayout(width, scale, option.value);
        assert.equal(layout.nameWidth, compact.nameWidth);
        assert.ok(Number.isInteger(layout.visibleDays));
        assert.ok(layout.visibleDays <= previousDays);
        assert.ok(
          layout.columnWidth >=
            Math.min(layout.dateWidth, option.width * scale),
        );
        assert.ok(
          Math.abs(
            layout.nameWidth + layout.columnWidth * layout.visibleDays - width,
          ) < 0.001,
        );
        previousDays = layout.visibleDays;
      }
    }
  }
  assert.deepEqual(
    columnSpacingOptions.map(
      (option) => gridLayout(366, 1, option.value).visibleDays,
    ),
    [4, 3, 2],
  );
  for (const width of [0, 20, 100])
    for (const option of columnSpacingOptions) {
      const layout = gridLayout(width, 1, option.value);
      assert.ok(layout.columnWidth >= 0 && Number.isFinite(layout.columnWidth));
      assert.ok(layout.nameWidth >= 0 && layout.visibleDays >= 1);
    }
});
test('week start aligns every calendar date with its weekday without changing date keys', () => {
  for (const month of [
    '2024-02',
    '2026-02',
    '2026-03',
    '2026-10',
    '2026-11',
    '2027-01',
  ]) {
    const monday = monthDays(month);
    for (const start of ['monday', 'sunday']) {
      const calendar = monthDays(month, start);
      const order = weekDayOrder(start);
      assert.deepEqual(calendar.days, monday.days);
      assert.equal(new Set(order).size, 7);
      calendar.days.forEach((date, index) => {
        const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
        assert.equal(order[(index + calendar.padding) % 7], weekday);
      });
    }
  }
  assert.deepEqual(weekDayOrder('monday'), [1, 2, 3, 4, 5, 6, 0]);
  assert.deepEqual(weekDayOrder('sunday'), [0, 1, 2, 3, 4, 5, 6]);
});
test('disabling fading restores recent-day brightness at every history/future tone', () => {
  for (const colour of ['#82E6BC', '#BDA5FF', '#F2ACAC', '#333333']) {
    const faded = createGridPalette(colour);
    const bright = createGridPalette(colour, false);
    assert.equal(bright.checkmark, faded.checkmark);
    for (const tone of bright.tones) assert.deepEqual(tone, faded.tones[0]);
    // Already-dark colours retain the existing brightness floor.
    if (colour !== '#333333')
      assert.notDeepEqual(faded.tones[0], faded.tones[4]);
    assert.deepEqual(createGridPalette(colour, true), faded);
  }
});
