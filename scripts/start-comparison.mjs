import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

// Use the installed Expo CLI and identical saved-data/diagnostic flags in both
// sessions. This tests production JS inside Expo Go, not a compiled release app.
const modes = {
  development: { port: '8083', flags: [] },
  'production-js': { port: '8082', flags: ['--no-dev', '--minify'] },
};
const mode = modes[process.argv[2]];
if (!mode || process.argv.length !== 3) {
  console.error(
    'Usage: node scripts/start-comparison.mjs development|production-js',
  );
  process.exit(2);
}
const require = createRequire(import.meta.url);
const expoCli = join(
  dirname(require.resolve('expo/package.json')),
  'bin',
  'cli',
);
const child = spawn(
  process.execPath,
  [
    expoCli,
    'start',
    '--go',
    '--port',
    mode.port,
    '--max-workers',
    '1',
    '--clear',
    ...mode.flags,
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      // A separate override survives SDK 57's development .env.local merge.
      // Never rewrite the founder's env files or relax release __DEV__ guards.
      EXPO_PUBLIC_DEV_COMPARISON: 'true',
    },
  },
);
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  console.error(`Could not start Expo: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
});
