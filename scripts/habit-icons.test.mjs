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

test('full regular catalogue preserves common choices and searches all icons by words, categories and aliases', async () => {
  const { searchHabitIcons } = await import('../src/searchHabitIcons.ts');
  const { commonHabitIcons } = await import('../src/commonHabitIcons.ts');
  assert.equal(habitIconCatalog.length, 1512);
  assert.deepEqual(
    searchHabitIcons('').map((item) => item.id),
    commonHabitIcons.map((item) => item.id),
  );
  assert.equal(searchHabitIcons('', true).length, 1512);
  for (const old of commonHabitIcons) {
    const current = habitIconCatalog.find((item) => item.id === old.id);
    assert.equal(current?.label, old.label);
    assert.ok(current?.tags.includes(old.tags));
  }
  assert.ok(
    searchHabitIcons('  PERSON_simple   RUN ').some(
      (item) => item.id === 'person-simple-run',
    ),
  );
  assert.ok(searchHabitIcons('hydration').some((item) => item.id === 'drop'));
  assert.ok(
    searchHabitIcons('health wellness').some(
      (item) => item.id === 'stethoscope',
    ),
  );
  assert.ok(searchHabitIcons('acorn').some((item) => item.id === 'acorn'));
  assert.ok(
    searchHabitIcons('archive-box').some(
      (item) => item.id === 'box-arrow-down',
    ),
  );
  assert.ok(
    habitIconCatalog.every((item) => !item.tags.includes('[object Object]')),
  );
  assert.deepEqual(searchHabitIcons('definitelynonexistenticon'), []);
  assert.deepEqual(searchHabitIcons('  '), searchHabitIcons(''));
  assert.deepEqual(
    searchHabitIcons('acorn', true),
    searchHabitIcons('acorn', false),
  );
});
