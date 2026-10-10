// Save the USB Android screen to .dev/android/latest.png. Node keeps this
// working on Windows, where npm scripts run in cmd.exe without mkdir -p.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const result = spawnSync('adb', ['exec-out', 'screencap', '-p'], {
  maxBuffer: 64 * 1024 * 1024,
});
if (result.error || result.status !== 0 || !result.stdout?.length) {
  console.error(
    result.error?.message ||
      result.stderr?.toString().trim() ||
      'adb returned no screenshot. Is the phone connected and authorised?',
  );
  process.exit(1);
}
mkdirSync('.dev/android', { recursive: true });
writeFileSync('.dev/android/latest.png', result.stdout);
console.log('Saved .dev/android/latest.png');
