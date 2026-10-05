// Expo iOS accelerometer units are g; positive Z means the screen faces down.
// Deliberate dwell and a settled return distinguish this from shakes/rotation.
export function previewMotionDetector(faceDownSign = 1) {
  let phase: 'idle' | 'ready' | 'armed' = 'idle';
  let since: number | null = null;
  let expires = 0,
    cooldown = 0;
  let previous: { x: number; y: number; z: number; at: number } | null = null;
  const reset = () => {
    phase = 'idle';
    since = null;
    previous = null;
  };
  return {
    reset,
    sample({
      x,
      y,
      z,
      at,
    }: {
      x: number;
      y: number;
      z: number;
      at: number;
    }): 'armed' | 'capture' | null {
      if (![x, y, z, at].every(Number.isFinite)) {
        reset();
        return null;
      }
      if (previous && (at <= previous.at || at - previous.at > 350)) reset();
      const delta = previous
        ? Math.hypot(x - previous.x, y - previous.y, z - previous.z)
        : Infinity;
      previous = { x, y, z, at };
      if (at < cooldown) return null;
      const gravity = Math.hypot(x, y, z);
      const settled = gravity >= 0.8 && gravity <= 1.2 && delta <= 0.16;
      const down = settled && z * faceDownSign >= 0.82;
      const viewing = settled && z * faceDownSign <= 0.35;
      if (phase === 'idle') {
        if (!viewing) since = null;
        else if (since === null) since = at;
        else if (at - since >= 350) {
          phase = 'ready';
          since = null;
        }
      } else if (phase === 'ready') {
        if (!down) since = null;
        else if (since === null) since = at;
        else if (at - since >= 500) {
          phase = 'armed';
          since = null;
          expires = at + 4000;
          return 'armed';
        }
      } else {
        if (at > expires) {
          reset();
          return null;
        }
        if (!viewing) since = null;
        else if (since === null) since = at;
        else if (at - since >= 350) {
          reset();
          cooldown = at + 2500;
          return 'capture';
        }
      }
      return null;
    },
  };
}
