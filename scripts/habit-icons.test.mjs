import assert from 'node:assert/strict';
import test from 'node:test';
import { isSingleEmoji, isHabitIcon } from '../src/habitIcons.ts';
import { habitIconCatalog } from '../src/habitIconCatalog.ts';
import { phosphorPaths } from '../src/phosphorPaths.ts';
import { historyPresentation } from '../src/history.ts';

test('emoji validation accepts a whole emoji including skin tones, flags and joined sequences', () => {
  for (const value of ['💧', '🏋️', '🚶🏽‍♀️', '👩🏿‍💻', '👨‍👩‍👧‍👦', '🇦🇺', '1️⃣', '❤️']) {
    assert.equal(isSingleEmoji(value), true, value);
    assert.equal(isHabitIcon(`emoji:${value}`), true, value);
  }
  for (const value of [
    '',
    '1',
    'abc',
    '💧🌙',
    ' 💧',
    '💧 ',
    '\u200D',
    '💧'.repeat(65),
  ])
    assert.equal(isSingleEmoji(value), false, value);
});
test('every stable pack ID has a bundled glyph and unknown packs/IDs are rejected', () => {
  assert.equal(
    new Set(habitIconCatalog.map((icon) => icon.id)).size,
    habitIconCatalog.length,
  );
  for (const icon of habitIconCatalog) {
    assert.equal(isHabitIcon(`phosphor:${icon.id}`), true);
    assert.ok(phosphorPaths[icon.id]?.every((path) => path.length > 0));
  }
  assert.deepEqual(
    Object.keys(phosphorPaths).sort(),
    habitIconCatalog.map((icon) => icon.id).sort(),
  );
  for (const icon of [
    'other:drop',
    'phosphor:missing',
    'phosphor:',
    'emoji:text',
    null,
    undefined,
  ])
    assert.equal(isHabitIcon(icon), false);
});
test('history distinguishes icon-only changes and removal from combined habit edits', () => {
  const before = { id: 'walk', name: 'Walk', color: '#82E6BC' };
  const present = (after) =>
    historyPresentation(
      { change: { kind: 'habit', habitId: 'walk', index: 0, before, after } },
      { habits: [after], values: {}, hapticsEnabled: true },
    ).summary;
  assert.equal(present({ ...before, icon: 'emoji:🚶' }), 'Icon changed');
  assert.equal(
    present({ ...before, name: 'Daily walk', icon: 'emoji:🚶' }),
    'Habit edited',
  );
  assert.equal(
    historyPresentation(
      {
        change: {
          kind: 'habit',
          habitId: 'walk',
          index: 0,
          before: { ...before, icon: 'emoji:🚶' },
          after: before,
        },
      },
      { habits: [before], values: {}, hapticsEnabled: true },
    ).summary,
    'Icon removed',
  );
});
