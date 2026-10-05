import test from 'node:test';
import assert from 'node:assert/strict';
import { previewMotionDetector } from '../src/dev/previewMotion.ts';
function fixture(sign = 1) {
  const detector = previewMotionDetector(sign);
  let at = 0;
  const actions = [];
  function hold(pose, samples = 9) {
    for (let i = 0; i < samples; i++) {
      at += 100;
      const action = detector.sample({ ...pose, at });
      if (action) actions.push(action);
    }
  }
  return {
    detector,
    actions,
    hold,
    jump: (time) => {
      at += time;
    },
  };
}
const viewing = { x: 0, y: -1, z: 0 };
const down = { x: 0, y: 0, z: 1 };
const up = { x: 0, y: 0, z: -1 };
test('face-down hold arms once, then settled viewing captures once, independent of portrait/landscape', () => {
  for (const returned of [viewing, up, { x: -1, y: 0, z: 0 }]) {
    const f = fixture();
    f.hold(viewing);
    f.hold(down);
    assert.deepEqual(f.actions, ['armed']);
    f.hold(returned);
    f.hold(returned, 35);
    assert.deepEqual(f.actions, ['armed', 'capture']);
    f.hold(down);
    f.hold(returned);
    assert.deepEqual(f.actions, ['armed', 'capture', 'armed', 'capture']);
  }
});
test('normal reading, rotating, brief flips, shakes and opening face down do not capture', () => {
  const f = fixture();
  f.hold(down, 30);
  f.hold(viewing);
  assert.deepEqual(f.actions, []);
  f.hold({ x: -1, y: 0, z: 0 });
  f.hold(up);
  f.hold(down, 4);
  f.hold(viewing);
  for (let i = 0; i < 20; i++) {
    f.hold({ x: 1.5, y: 0, z: 2 }, 1);
    f.hold({ x: -1.5, y: 0, z: -2 }, 1);
  }
  f.hold(viewing);
  assert.deepEqual(f.actions, []);
});
test('long pauses, missed samples, reset/backgrounding and cooldown cancel or suppress captures', () => {
  const f = fixture();
  f.hold(viewing);
  f.hold(down, 55);
  f.hold(viewing);
  assert.deepEqual(f.actions, ['armed']);
  f.hold(down);
  f.jump(1000);
  f.hold(viewing);
  assert.deepEqual(f.actions, ['armed', 'armed']);
  f.hold(down);
  f.detector.reset();
  f.hold(viewing);
  assert.deepEqual(f.actions, ['armed', 'armed', 'armed']);
  f.hold(down);
  f.hold(viewing);
  const count = f.actions.filter((x) => x === 'capture').length;
  f.hold(down);
  f.hold(viewing);
  assert.equal(f.actions.filter((x) => x === 'capture').length, count);
  assert.equal(f.detector.sample({ x: NaN, y: 0, z: 0, at: 10000 }), null);
  assert.equal(f.detector.sample({ x: 0, y: 0, z: 1, at: 1 }), null);
});
test('Android opposite gravity sign follows the same intentional sequence', () => {
  const f = fixture(-1);
  f.hold(viewing);
  f.hold(up);
  f.hold(down);
  assert.deepEqual(f.actions, ['armed', 'capture']);
});
